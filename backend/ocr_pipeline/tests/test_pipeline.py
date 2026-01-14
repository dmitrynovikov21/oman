"""
Local Test Script for OCR Pipeline

Run this to test entity extraction without OCR models.
Uses the bad_ocr_sample.txt as input.

Usage:
    python -m ocr_pipeline.tests.test_pipeline
"""

import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from ocr_pipeline.pipeline.normalizer import ArabicNormalizer
from ocr_pipeline.pipeline.entity_extractor import EntityExtractor


def test_entity_extraction():
    """Test entity extraction on sample OCR text"""
    
    # Sample text simulating OCR output
    sample_text = """
المحكمة الابتدائية بصور ( الدائرة العمالية)
 الموضوع : صحيفة دعوى افتتاحية
 مقدمة من
 0 أحمد بن سالم بن عبدالله البادي (المدعي)

 يمثله قانونا: شركة الجرادي وقيس الراشدي (شركة مدنية للمحاماة)
 العنوان: ولاية بوشر. غلا التجارية . بناية أبراج النهضة ؟. الطابق الثاني . مكتب رقم 1 . هاتف(407/7749)

 شيمواجههة

.ب ماماو ماسموا

 العنوان: ولاية صور. مدائن صور . رقم الهاتف(971117//8)

 فضيلة القاضي رئيس هيئة المحكمة الموقرة
 السلا ر علكرى رجت ال دس كاتى؛.وجعل
 بكل تقديرواحترام؛ ونيابة عن موكلنا المدعي بموجب سند الوكالة نقدم لعدالة المحكمة الموقرة
 صحيفة دعوى افتتاحية ؛ وفقا لمايلي:
 أولا / قبول سماع الدعوى

 استنفذ المدعي كافة الطرق القانونية اللازمة التي قررتها المادة ‎)٠١17(‏ من قانون العمل لقبول سماع
 المرجعي (REF2401040246). وقد تعذرت التسوبة الودية. مما حدا بوزارة العمل إلى إحالة الدعوى إلى
المحكمة

 ثانيا/الوقائع:
 موكلنا المدعي عامل لدى شركة بي اس أي مارين قلهات بالمستى الوظيفي مساعد مهندس بأجر إجماليوقدره
 (١٠ر.ع).‏ الشركة المدعى عليها تمارس أنشطة الأعمال البحرية وتحمل السجل التجاري رقم‎)١"١7697(‏
 ‏تتلخص اشكالية العمال ومنهم المدعي ؛ أنهم بحارة يعملون بالقرب من ميناء صورداخل زوارق عائمةتستخدم
 لسحب السفن الكبيرة إلى الرصيف البحري ولاستخدامات متعددة كذلك ؛ وبعملون بنظام المناوبة سبعة أيامعمل
 مقابل سبعة أيام إجازة إلا أن المدعى عليها تفرض عليهم أشكالا من العمل القسري والجبري في فترة عملهموذلك

--- PAGE 7 FOOTER SIMULATION ---
Phone: 95788279
CR: 1204693
--------------------------------
"""

    print("=" * 60)
    print("ExpertOS OCR Pipeline - Entity Extraction Test")
    print("=" * 60)
    
    # Initialize components
    normalizer = ArabicNormalizer()
    extractor = EntityExtractor()
    
    # Step 1: Normalize text
    print("\n[STEP 1] Normalizing Arabic text...")
    norm_result = normalizer.normalize(sample_text)
    
    print(f"  Changes made: {len(norm_result.changes_made)}")
    for change in norm_result.changes_made[:5]:
        print(f"    - {change}")
    if len(norm_result.changes_made) > 5:
        print(f"    ... and {len(norm_result.changes_made) - 5} more")
    
    # Step 2: Extract entities
    print("\n[STEP 2] Extracting entities...")
    result = extractor.extract_all(norm_result.normalized)
    
    # Display results
    print("\n" + "=" * 60)
    print("EXTRACTION RESULTS")
    print("=" * 60)
    
    print(f"\n📞 Phone:     {result.phone or 'NOT FOUND'}")
    print(f"🏢 CR:        {result.cr or 'NOT FOUND'}")
    print(f"🆔 Civil ID:  {result.civil_id or 'NOT FOUND'}")
    print(f"📅 Dates:     {len(result.dates)} found")
    print(f"💰 Amounts:   {len(result.amounts)} found")
    print(f"⚠️  Warnings:  {result.warnings}")
    print(f"✅ Confidence: {result.confidence.value}")
    
    # Validate expected values
    print("\n" + "=" * 60)
    print("VALIDATION")
    print("=" * 60)
    
    # NOTE: The healed CR (1217697) is from context near "السجل التجاري"
    # The 1204693 in footer is a simulation - in real docs, context-first is correct
    expected = {
        "phone": "95788279",
        "cr": "1217697"  # Healed from ١\"١7697 -> 1217697
    }
    
    phone_ok = result.phone == expected["phone"]
    cr_ok = result.cr == expected["cr"]
    
    print(f"\n  Phone extraction: {'✅ PASS' if phone_ok else '❌ FAIL'}")
    if not phone_ok:
        print(f"    Expected: {expected['phone']}, Got: {result.phone}")
    
    print(f"  CR extraction:    {'✅ PASS' if cr_ok else '❌ FAIL'}")
    if not cr_ok:
        print(f"    Expected: {expected['cr']}, Got: {result.cr}")
    
    salary_warning = any("SUSPICIOUS_SALARY" in w for w in result.warnings)
    print(f"  Salary warning:   {'✅ PASS' if salary_warning else '⚠️  NO WARNING'}")
    
    print("\n" + "=" * 60)
    
    return phone_ok and cr_ok


def test_context_first_cr():
    """Test that CR is extracted from context, not just first match"""
    
    print("\n\n" + "=" * 60)
    print("CONTEXT-FIRST CR EXTRACTION TEST")
    print("=" * 60)
    
    # Text with CR near keyword and a false positive elsewhere
    test_text = """
    رقم المرجع: 10162500
    رسوم المحكمة: 2450298
    
    الشركة المدعى عليها تحمل السجل التجاري رقم 1204693
    """
    
    extractor = EntityExtractor()
    result = extractor.extract_all(test_text)
    
    expected_cr = "1204693"
    cr_ok = result.cr == expected_cr
    
    print(f"\n  CR extracted: {result.cr}")
    print(f"  Expected:     {expected_cr}")
    print(f"  Result:       {'✅ PASS' if cr_ok else '❌ FAIL'}")
    
    if not cr_ok:
        print("\n  ⚠️  System picked wrong number!")
        print("     Should prioritize CR near 'السجل التجاري' keyword")
    
    return cr_ok


def test_broken_cr_healing():
    """Test healing of OCR-broken CR numbers"""
    
    print("\n\n" + "=" * 60)
    print("BROKEN CR HEALING TEST")
    print("=" * 60)
    
    # Text with broken CR pattern
    test_text = """
    الشركة تحمل السجل التجاري رقم )١"١7697(
    """
    
    extractor = EntityExtractor()
    result = extractor.extract_all(test_text)
    
    print(f"\n  Input CR pattern: ١\"١7697")
    print(f"  Extracted CR:     {result.cr}")
    print(f"  Warnings:         {result.warnings}")
    
    healed = result.cr is not None and len(result.cr) in (7, 8)
    print(f"  Healing worked:   {'✅ PASS' if healed else '⚠️  NOT HEALED'}")
    
    return healed


if __name__ == "__main__":
    print("\n" + "🚀 " * 20)
    print("Starting OCR Pipeline Tests")
    print("🚀 " * 20)
    
    results = []
    
    try:
        results.append(("Entity Extraction", test_entity_extraction()))
    except Exception as e:
        print(f"❌ Entity Extraction test failed: {e}")
        results.append(("Entity Extraction", False))
    
    try:
        results.append(("Context-First CR", test_context_first_cr()))
    except Exception as e:
        print(f"❌ Context-First CR test failed: {e}")
        results.append(("Context-First CR", False))
    
    try:
        results.append(("Broken CR Healing", test_broken_cr_healing()))
    except Exception as e:
        print(f"❌ Broken CR Healing test failed: {e}")
        results.append(("Broken CR Healing", False))
    
    # Summary
    print("\n\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        print(f"  {'✅' if result else '❌'} {name}")
    
    print(f"\n  Total: {passed}/{total} passed")
    print("=" * 60)
