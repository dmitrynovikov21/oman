<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCasesStore } from '../store';

const router = useRouter();
const { cases, addCase, loadCases } = useCasesStore();

const showNewCase = ref(false);
const form = ref({
  caseNumber: '',
});

// Removed unused isRtl
const busy = ref(false);

const healthStatus = ref<'checking' | 'ok' | 'error'>('checking');

function openCase(id: string) {
  router.push({ name: 'case-detail', params: { id } });
}

function resetForm() {
  form.value = {
    caseNumber: '',
  };
}

async function submitNewCase() {
  if (!form.value.caseNumber) return;
  busy.value = true;
  await addCase({ ...form.value });
  busy.value = false;
  resetForm();
  showNewCase.value = false;
}

onMounted(async () => {
  loadCases();
  try {
    healthStatus.value = 'ok';
  } catch {
    healthStatus.value = 'error';
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-['Space_Grotesk'] selection:bg-[#F4E604] selection:text-black">
    
    <!-- HEADER -->
    <header class="px-8 py-12 md:px-16 md:py-20 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-8">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-2 h-2 bg-[#F4E604]"></div>
          <span class="font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-white/60">Enaya Legal AI System</span>
        </div>
        <h1 class="text-6xl md:text-8xl font-light tracking-tighter leading-[0.9]">
          LABOR<br/>CASES
        </h1>
      </div>
      
      <div class="flex flex-col items-end gap-6">
        <div class="font-['JetBrains_Mono'] text-xs text-right space-y-1">
          <div class="flex items-center gap-2 justify-end">
            <span class="w-1.5 h-1.5 bg-[#F4E604] animate-pulse"></span>
            <span>SYSTEM ONLINE</span>
          </div>
          <div class="text-white/40">{{ cases.length }} ACTIVE RECORDS</div>
        </div>
        
        <button 
          @click="showNewCase = true"
          class="group relative px-8 py-4 bg-white text-black font-['JetBrains_Mono'] font-bold uppercase tracking-wider text-sm hover:bg-[#F4E604] transition-colors duration-0"
        >
          <span class="absolute top-0 left-0 w-full h-full border border-white group-hover:border-[#F4E604]"></span>
          + Initialize Case
        </button>
      </div>
    </header>

    <!-- CASE LIST -->
    <section class="px-8 md:px-16 py-12">
      <div v-if="cases.length === 0" class="py-32 text-center border-t border-b border-white/10">
        <p class="font-['JetBrains_Mono'] text-white/30 text-xl">NO CASES INITIALIZED</p>
      </div>

      <div v-else class="grid grid-cols-1">
        <div 
          v-for="c in cases" 
          :key="c.id" 
          @click="openCase(c.id)"
          class="group relative border-b border-white/10 py-10 cursor-pointer hover:bg-[#111] transition-colors duration-200"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <!-- ID & Status -->
            <div class="flex flex-col gap-2 md:w-1/4">
              <span class="font-['JetBrains_Mono'] text-xs text-[#F4E604]">
                {{ c.status === 'New' ? '● AWAITING DATA' : c.status === 'Processing' ? '◑ PROCESSING' : '● REPORT READY' }}
              </span>
              <span class="text-3xl font-medium">{{ c.caseNumber }}</span>
            </div>

            <!-- Details -->
            <div class="flex flex-col md:w-1/2 gap-1">
              <span class="font-['JetBrains_Mono'] text-xs text-white/40 uppercase">Jurisdiction</span>
              <span class="text-xl text-white/80">{{ c.court || 'Not Assigned' }}</span>
            </div>

            <!-- Action -->
            <div class="md:w-1/6 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span class="text-[#F4E604] text-4xl">→</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MODAL -->
    <teleport to="body">
      <div v-if="showNewCase" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div class="w-full max-w-xl bg-[#050505] border border-white/20 p-12 relative">
          <!-- Close X -->
          <button @click="showNewCase = false" class="absolute top-6 right-6 text-white/50 hover:text-[#F4E604]">✕</button>

          <h2 class="text-4xl font-light mb-12 tracking-tight">INITIALIZE<br>NEW CASE</h2>
          
          <div class="space-y-8">
            <div class="group">
              <label class="block font-['JetBrains_Mono'] text-xs text-[#F4E604] mb-2 uppercase">Case Reference Number</label>
              <input 
                v-model="form.caseNumber" 
                type="text" 
                placeholder="XXX/YYYY/0000"
                class="w-full bg-transparent border-b border-white/20 py-4 text-2xl outline-none focus:border-[#F4E604] transition-colors placeholder-white/10 font-['Space_Grotesk']"
                autofocus
              />
            </div>
          </div>

          <div class="mt-16 flex justify-end gap-6">
            <button 
              @click="showNewCase = false" 
              class="px-6 py-3 font-['JetBrains_Mono'] text-xs uppercase hover:text-white/60 transition-colors"
            >
              Abort
            </button>
            <button 
              @click="submitNewCase" 
              :disabled="busy"
              class="px-8 py-3 bg-[#F4E604] text-black font-['JetBrains_Mono'] font-bold uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ busy ? 'Processing...' : 'Create Case' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>
