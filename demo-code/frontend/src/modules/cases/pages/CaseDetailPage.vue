<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCasesStore } from '../store';
import type { DocumentCategory } from '../types';

const route = useRoute();
const router = useRouter();
const { getCaseById, addDocument, generateReport, loadCase, updateMeetingNotes } = useCasesStore();

const currentId = computed(() => String(route.params.id ?? ''));
const currentCase = getCaseById(currentId.value);

const activeTab = ref<'documents' | 'analysis' | 'report'>('documents');

const analysisLoading = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const uploadBusy = ref(false);

const fileInputCourt = ref<HTMLInputElement | null>(null);
const fileInputPlaintiff = ref<HTMLInputElement | null>(null);
const fileInputDefendant = ref<HTMLInputElement | null>(null);
const fileInputMeeting = ref<HTMLInputElement | null>(null);

const dragOverCategory = ref<DocumentCategory | null>(null);
const meetingNotesDraft = ref('');

let pollInterval: number | null = null;

onMounted(async () => {
    if (currentId.value) {
        await loadCase(currentId.value);
        if (currentCase.value?.manualMeetingNotes) {
            meetingNotesDraft.value = currentCase.value.manualMeetingNotes;
        }
        startPolling();
    }
});

onUnmounted(() => {
    stopPolling();
});

function startPolling() {
    stopPolling();
    pollInterval = setInterval(async () => {
        if (currentCase.value && hasProcessingDocs()) {
             await loadCase(currentCase.value.id);
        }
    }, 3000) as unknown as number;
}

function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

function hasProcessingDocs() {
    if (!currentCase.value) return false;
    return currentCase.value.documents.some(d => d.status === 'processing');
}

function showSimpleToast(message: string) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

async function handleFileUpload(event: Event, category: DocumentCategory) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const file = target.files[0];
        if (file) {
            await processUpload(file, category);
        }
        target.value = '';
    }
}

async function processUpload(file: File, category: DocumentCategory) {
    if (!currentCase.value) return;
    uploadBusy.value = true;
    try {
        await addDocument(currentCase.value.id, file, category);
        showSimpleToast(`Processing ${file.name}...`);
    } catch (e) {
        showSimpleToast('Upload failed');
        console.error(e);
    } finally {
        uploadBusy.value = false;
    }
}

function triggerUpload(category: DocumentCategory) {
    if (category === 'court') fileInputCourt.value?.click();
    if (category === 'plaintiff') fileInputPlaintiff.value?.click();
    if (category === 'defendant') fileInputDefendant.value?.click();
    if (category === 'meeting_notes') fileInputMeeting.value?.click();
}

function onDragOver(e: DragEvent, category: DocumentCategory) {
    e.preventDefault();
    dragOverCategory.value = category;
}

function onDragLeave(e: DragEvent) {
    e.preventDefault();
    dragOverCategory.value = null;
}

function onDrop(e: DragEvent, category: DocumentCategory) {
    e.preventDefault();
    dragOverCategory.value = null;
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file) {
            processUpload(file, category);
        }
    }
}

async function startAnalysis() {
    if (!currentCase.value) return;
    analysisLoading.value = true;
    
    updateMeetingNotes(currentCase.value.id, meetingNotesDraft.value);

    try {
        await generateReport(currentCase.value.id);
        showSimpleToast('Report generated successfully');
        // Auto-switch to analysis tab
        activeTab.value = 'analysis';
    } catch (e) {
        showSimpleToast('Analysis failed');
        console.error(e);
    } finally {
        analysisLoading.value = false;
    }
}

function saveMeetingNotes() {
    if (!currentCase.value) return;
    updateMeetingNotes(currentCase.value.id, meetingNotesDraft.value);
    showSimpleToast('Notes saved');
}

const courtDocs = computed(() => currentCase.value?.documents.filter((d) => d.category === 'court') ?? []);
const plaintiffDocs = computed(() => currentCase.value?.documents.filter((d) => d.category === 'plaintiff') ?? []);
const defendantDocs = computed(() => currentCase.value?.documents.filter((d) => d.category === 'defendant') ?? []);
const meetingDocs = computed(() => currentCase.value?.documents.filter((d) => d.category === 'meeting_notes') ?? []);

const aiReportHtml = computed(() => currentCase.value?.report?.htmlContent);

</script>

<template>
  <div v-if="currentCase" class="min-h-screen bg-[#050505] text-white font-['Space_Grotesk']">
    
    <input type="file" ref="fileInputCourt" class="hidden" @change="handleFileUpload($event, 'court')" accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.m4a,.mp4,audio/mp4,audio/x-m4a,audio/mpeg" />
    <input type="file" ref="fileInputPlaintiff" class="hidden" @change="handleFileUpload($event, 'plaintiff')" accept=".pdf,.doc,.docx,.txt,.zip,.mp3,.wav,.m4a,.mp4,audio/mp4,audio/x-m4a,audio/mpeg" />
    <input type="file" ref="fileInputDefendant" class="hidden" @change="handleFileUpload($event, 'defendant')" accept=".pdf,.doc,.docx,.txt,.zip,.mp3,.wav,.m4a,.mp4,audio/mp4,audio/x-m4a,audio/mpeg" />
    <input type="file" ref="fileInputMeeting" class="hidden" @change="handleFileUpload($event, 'meeting_notes')" accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.m4a,.mp4,audio/mp4,audio/x-m4a,audio/mpeg" />

    <header class="px-8 pt-12 pb-8 border-b border-white/10">
      <button 
        type="button"
        class="mb-8 font-['JetBrains_Mono'] text-xs text-white/40 hover:text-[#F4E604] transition-colors uppercase tracking-widest"
        @click="router.push({ name: 'cases' })"
      >
        ← Return to Index
      </button>
      
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 class="text-5xl font-light tracking-tight mb-2">Case {{ currentCase.caseNumber }}</h1>
          <p class="font-['JetBrains_Mono'] text-xs text-[#F4E604]">
            LAST UPDATE: {{ new Date(currentCase.updatedAt).toLocaleDateString().toUpperCase() }}
          </p>
        </div>
        
        <div class="flex gap-12">
          <div class="text-right">
            <span class="block font-['JetBrains_Mono'] text-[10px] text-white/40 uppercase">Plaintiff</span>
            <span class="text-lg">{{ currentCase.plaintiff || 'Unknown' }}</span>
          </div>
          <div class="text-right">
            <span class="block font-['JetBrains_Mono'] text-[10px] text-white/40 uppercase">Defendant</span>
            <span class="text-lg">{{ currentCase.defendant || 'Unknown' }}</span>
          </div>
        </div>
      </div>

      <div class="mt-16 flex gap-8 border-b border-white/10">
        <button 
          v-for="tab in ['documents', 'analysis']" 
          :key="tab"
          @click="activeTab = tab as any"
          class="pb-4 text-sm font-['JetBrains_Mono'] uppercase tracking-wider transition-colors relative"
          :class="activeTab === tab ? 'text-[#F4E604]' : 'text-white/40 hover:text-white'"
        >
          {{ tab }}
          <span v-if="activeTab === tab" class="absolute bottom-0 left-0 w-full h-[2px] bg-[#F4E604]"></span>
        </button>
      </div>
    </header>

    <main class="p-8 md:p-16 max-w-[1600px] mx-auto">
      
      <div v-if="activeTab === 'documents'" class="animate-fade-in flex flex-col gap-16">
        
        <!-- Top 3 Blocks -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
             <div 
                v-for="(config) in [
                  { title: '01 // COURT APPOINTMENT', cat: 'court', docs: courtDocs, desc: 'Mandate & Orders' },
                  { title: '02 // PLAINTIFF DOCS', cat: 'plaintiff', docs: plaintiffDocs, desc: 'Claims & Evidence' },
                  { title: '03 // DEFENDANT DOCS', cat: 'defendant', docs: defendantDocs, desc: 'Defense & Rebuttal' }
                ]"
                :key="config.cat"
                class="bg-[#050505] p-12 min-h-[300px] relative group transition-colors"
                :class="dragOverCategory === config.cat ? 'bg-[#111]' : ''"
                @dragover="onDragOver($event, config.cat as DocumentCategory)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, config.cat as DocumentCategory)"
                @click="triggerUpload(config.cat as DocumentCategory)"
              >
                <div class="absolute inset-4 border border-dashed border-white/10 pointer-events-none transition-colors group-hover:border-[#F4E604]/50" 
                     :class="dragOverCategory === config.cat ? 'border-[#F4E604]' : ''"></div>

                <div class="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <h3 class="font-['JetBrains_Mono'] text-[#F4E604] text-xs mb-2">{{ config.title }}</h3>
                    <p class="text-white/40 text-sm max-w-[200px]">{{ config.desc }}</p>
                  </div>

                  <div class="space-y-2 mt-8">
                    <div v-for="doc in config.docs" :key="doc.id" class="flex items-center justify-between border-b border-white/10 pb-2">
                      <span class="text-sm truncate max-w-[70%]">{{ doc.name }}</span>
                      <span class="font-['JetBrains_Mono'] text-[10px]" 
                            :class="doc.status === 'processing' ? 'text-[#F4E604] animate-pulse' : 'text-white/30'">
                        {{ doc.status.toUpperCase() }}
                      </span>
                    </div>
                    <div v-if="config.docs.length === 0" class="text-white/20 text-sm italic">
                      Drag & Drop or Click
                    </div>
                  </div>
                </div>
              </div>
        </div>

        <!-- Meeting Notes (Full Width) -->
        <div 
            class="bg-[#050505] p-12 relative group transition-colors border border-white/10"
            :class="dragOverCategory === 'meeting_notes' ? 'bg-[#111]' : ''"
            @dragover="onDragOver($event, 'meeting_notes')"
            @dragleave="onDragLeave"
            @drop="onDrop($event, 'meeting_notes')"
            @click="triggerUpload('meeting_notes')"
        >
            <div class="absolute inset-4 border border-dashed border-white/10 pointer-events-none transition-colors group-hover:border-[#F4E604]/50" 
                 :class="dragOverCategory === 'meeting_notes' ? 'border-[#F4E604]' : ''"></div>
            
            <div class="relative z-10">
                <div class="flex flex-col md:flex-row justify-between mb-8">
                     <div>
                        <h3 class="font-['JetBrains_Mono'] text-[#F4E604] text-xs mb-2">04 // MEETING NOTES</h3>
                        <p class="text-white/40 text-sm">Audio Recordings & Transcripts</p>
                     </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <!-- File List -->
                     <div>
                        <h4 class="font-['JetBrains_Mono'] text-white/50 text-[10px] uppercase mb-4">Attached Files</h4>
                        <div class="space-y-2">
                            <div v-for="doc in meetingDocs" :key="doc.id" class="flex items-center justify-between border-b border-white/10 pb-2">
                              <span class="text-sm truncate max-w-[70%]">{{ doc.name }}</span>
                              <span class="font-['JetBrains_Mono'] text-[10px]" 
                                    :class="doc.status === 'processing' ? 'text-[#F4E604] animate-pulse' : 'text-white/30'">
                                {{ doc.status.toUpperCase() }}
                              </span>
                            </div>
                            <div v-if="meetingDocs.length === 0" class="text-white/20 text-sm italic">
                              Drag & Drop Audio/Docs here
                            </div>
                        </div>
                     </div>

                     <!-- Manual Notes -->
                     <div class="border-l border-white/10 pl-0 md:pl-12" @click.stop>
                        <h4 class="font-['JetBrains_Mono'] text-white/50 text-[10px] uppercase mb-4">Session Notes</h4>
                        <textarea 
                           v-model="meetingNotesDraft"
                           placeholder="Type notes here..."
                           class="w-full bg-transparent text-sm text-white placeholder-white/20 outline-none resize-none font-['JetBrains_Mono'] mb-4 min-h-[150px] border border-white/10 p-4 focus:border-[#F4E604]"
                        ></textarea>
                        <div class="text-right">
                             <button @click="saveMeetingNotes" class="px-6 py-2 border border-[#F4E604] text-[10px] text-[#F4E604] hover:bg-[#F4E604] hover:text-black transition-colors uppercase tracking-widest">Save Note</button>
                        </div>
                     </div>
                </div>
            </div>
        </div>

        <!-- ACTION BAR -->
        <div class="flex justify-center pb-20 pt-12">
          <button 
            @click="startAnalysis"
            :disabled="analysisLoading"
            class="px-12 py-6 bg-[#F4E604] text-black font-bold text-xl uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
          >
            {{ analysisLoading ? 'Analyzing Data stream...' : 'Generate Legal Intelligence' }}
          </button>
        </div>

      </div>

      <div v-else-if="activeTab === 'analysis'" class="max-w-4xl mx-auto">
        <div v-if="aiReportHtml" class="bg-white text-black p-12 md:p-20 shadow-2xl">
          <div class="mb-12 border-b-4 border-black pb-8">
             <h2 class="text-4xl font-bold uppercase">Official Report</h2>
             <p class="font-['JetBrains_Mono'] text-sm mt-2">generated by Enaya AI</p>
          </div>
          
          <div class="prose max-w-none font-serif prose-headings:font-sans prose-headings:uppercase prose-headings:tracking-wide text-right" dir="rtl" v-html="aiReportHtml"></div>
        </div>
        
        <div v-else class="text-center py-32">
          <p class="font-['JetBrains_Mono'] text-white/40 uppercase">No intelligence generated yet.</p>
        </div>
      </div>

    </main>

    <div v-if="showToast" class="fixed bottom-8 right-8 bg-[#F4E604] text-black px-6 py-3 font-['JetBrains_Mono'] text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
      {{ toastMessage }}
    </div>

    <!-- AI PROCESSING OVERLAY -->
    <div v-if="analysisLoading" class="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-md flex flex-col items-center justify-center">
        <div class="text-[#F4E604] text-8xl font-bold animate-pulse tracking-tighter">AI THINKING</div>
        <div class="mt-8 flex flex-col items-center gap-2 font-['JetBrains_Mono'] text-white/60">
            <p>READING DOCUMENTS...</p>
            <p>ANALYZING PRECEDENTS...</p>
            <p>DRAFTING LEGAL REPORT...</p>
        </div>
        <div class="mt-12 w-64 h-1 bg-white/10 overflow-hidden">
            <div class="h-full bg-[#F4E604] w-full animate-progress-infinite origin-left-right"></div>
        </div>
    </div>

    <style>
    @keyframes progress-infinite {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0); }
        100% { transform: translateX(100%); }
    }
    .animate-progress-infinite {
        animation: progress-infinite 1.5s infinite ease-in-out;
    }
    </style>

  </div>
  <div v-else class="h-screen flex items-center justify-center bg-[#050505] text-white font-['JetBrains_Mono']">
    LOADING SYSTEM...
  </div>
</template>

<style scoped>
.prose :deep(h1) {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #000;
  padding-bottom: 0.5rem;
}
.prose :deep(h3) {
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 700;
}
.prose :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.6;
}
.prose :deep(ul) {
  list-style-type: square;
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}
</style>