<template>
  <div class="gameboy-container">
    <!-- Scanline effect for authentic retro feel -->
    <div class="scanlines"></div>

    <!-- Power LED indicator -->
    <div class="power-led"></div>

    <!-- Sloth Animation -->
    <div class="animation-container">
      <DotLottieVue
        style="height: 320px; width: 320px; margin: 0 auto"
        autoplay
        loop
        src="https://lottie.host/7ef4c8db-5248-4d6e-ad89-100b347271fe/ErGYchfVkU.lottie"
      />
      <!-- Loading overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-text">PROCESSING...</div>
      </div>
    </div>

    <!-- Excuse Display Screen -->
    <div class="gameboy-screen">
      <div class="screen-content">
        <p v-if="excuse" class="excuse-text">{{ displayedExcuse }}</p>
        <p v-else class="thinking-text">
          Sloth is thinking<span class="blinking-cursor">|</span>
        </p>
      </div>
    </div>

    <!-- Controls Section -->
    <div class="controls-section">
      <select
        v-model="category"
        @change="onCategoryChange"
        class="control-input"
        :disabled="loading"
      >
        <option disabled value="">Choose a category</option>
        <option v-for="c in categories" :key="c" :value="c">
          {{ formatLabel(c) }}
        </option>
      </select>

      <select
        v-model="tag"
        class="control-input"
        :disabled="loading || !category"
      >
        <option disabled value="">Choose a tag</option>
        <option v-for="t in availableTags" :key="t" :value="t">
          {{ formatLabel(t) }}
        </option>
      </select>

      <input
        v-model="customTask"
        placeholder="Or enter custom task..."
        class="control-input"
        :disabled="loading"
        @keyup.enter="getExcuse"
      />

      <div class="button-group">
        <button @click="getExcuse" :disabled="loading" class="btn-primary">
          <span v-if="loading" class="loading-button">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle
                class="spinner-circle"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
                fill="none"
              ></circle>
              <path
                class="spinner-path"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            LOADING...
          </span>
          <span v-else>GENERATE EXCUSE</span>
        </button>

        <button
          @click="clearAll"
          :disabled="loading"
          class="btn-secondary"
          title="Clear all fields"
        >
          CLEAR
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Statistics -->
    <div class="stats-counter">Excuses generated: {{ excuseCount }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

// State
const category = ref("");
const tag = ref("");
const customTask = ref("");
const excuse = ref("");
const displayedExcuse = ref("");
const loading = ref(false);
const error = ref("");
const excuseCount = ref(0);

// Enhanced categories with better organization
const categories = ["general", "social", "work", "exercise"];

const tags = [
  "tech",
  "health",
  "transport",
  "education",
  "cat",
  "procrastination",
  "pet",
  "weather",
  "dog",
  "mental",
  "fun",
  "general",
  "social",
  "work",
  "exercise",
];

// Computed properties
const availableTags = computed(() => {
  return tags;
});

// Watchers
watch(category, () => {
  tag.value = "";
  error.value = "";
});

watch(customTask, () => {
  if (customTask.value.trim()) {
    category.value = "";
    tag.value = "";
  }
});

// Methods
const formatLabel = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const onCategoryChange = () => {
  error.value = "";
  if (availableTags.value.length === 1) {
    tag.value = availableTags.value[0];
  }
};

const typewriterEffect = (text) => {
  displayedExcuse.value = "";
  let i = 0;
  const interval = setInterval(() => {
    displayedExcuse.value += text.charAt(i);
    i++;
    if (i >= text.length) {
      clearInterval(interval);
    }
  }, 40);
};

const API_BASE_URL =
  process.env.VUE_APP_API_BASE_URL ||
  "https://too-lazy-as-a-service.onrender.com";

const getExcuse = async () => {
  if (loading.value) return;

  loading.value = true;
  error.value = "";
  excuse.value = "";
  displayedExcuse.value = "";

  try {
    let response;

    if (customTask.value.trim()) {
      console.log("Sending POST with custom task:", customTask.value);
      response = await axios.post(
        `${API_BASE_URL}/api/excuse/custom`,
        { task: customTask.value.trim() },
        { timeout: 10000 }
      );
    } else if (category.value) {
      const params = tag.value ? { tag: tag.value } : {};
      console.log(
        `Sending GET for category=${category.value} with tag=${tag.value}`
      );
      response = await axios.get(
        `${API_BASE_URL}/api/excuse/${category.value}`,
        {
          params,
          timeout: 10000,
        }
      );
    } else {
      console.log("Sending GET for random excuse");
      response = await axios.get(`${API_BASE_URL}/api/excuse`, {
        timeout: 10000,
      });
    }

    console.log("API response data:", response.data);

    const newExcuse =
      response.data.excuse || response.data.excuses || "No excuse found";

    const newCategory = response.data.category || "general";

    if (newCategory === "Who Care?") {
      error.value =
        "The sloth refused to work. Try again later (or don't)" ||
        "The sloth refused to respond. Typical.";
      excuse.value = "";
    } else {
      error.value = "";
      excuse.value = newExcuse;
      excuseCount.value++;
      setTimeout(() => {
        typewriterEffect(newExcuse);
      }, 500);
    }
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      error.value = "Request timed out. Sloth is being extra slow today.";
    } else if (err.response?.status === 429) {
      error.value = "Too many requests. Even sloths have limits.";
    } else if (err.response?.status >= 500) {
      error.value = "Server error. The sloth server is taking a nap.";
    } else {
      error.value = "The sloth refused to respond. Typical.";
    }

    excuse.value = "I'm too lazy to come up with an excuse right now.";
    typewriterEffect(excuse.value);
  } finally {
    loading.value = false;
  }
};
const clearAll = () => {
  category.value = "";
  tag.value = "";
  customTask.value = "";
  excuse.value = "";
  displayedExcuse.value = "";
  error.value = "";
};

onMounted(() => {
  const savedCount = localStorage.getItem("sloth-excuse-count");
  if (savedCount) {
    excuseCount.value = parseInt(savedCount);
  }
});

watch(excuseCount, (newCount) => {
  localStorage.setItem("sloth-excuse-count", newCount.toString());
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");

/* Main container */
.gameboy-container {
  background-color: #f4e07d;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: 350px;
  text-align: center;
  border: 4px solid black;
  font-family: "Press Start 2P", cursive;
  position: relative;
  overflow: hidden;
}

/* Scanline effect */
.scanlines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 4px,
    rgba(0, 0, 0, 0.03) 4px,
    rgba(0, 0, 0, 0.03) 6px
  );
  pointer-events: none;
  z-index: 1;
}

/* Power LED */
.power-led {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  background-color: #ef4444;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Animation container */
.animation-container {
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
}

.loading-text {
  color: white;
  font-size: 0.75rem;
}

/* Screen */
.gameboy-screen {
  background-color: #f1a1f0;
  padding: 0.75rem;
  border-radius: 0.25rem;
  border: 4px solid black;
  margin-bottom: 1rem;
  position: relative;
  font-size: 14px;
  line-height: 1.2;
  min-height: 70px;
  overflow: hidden;
}

.gameboy-screen::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.05) 2px,
    rgba(0, 0, 0, 0.05) 4px
  );
  pointer-events: none;
}

.screen-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 54px;
}

.excuse-text {
  white-space: pre-wrap;
  font-family: "Courier New", monospace;
  color: #003349;
  border-right: 2px solid #003349;
  font-weight: bold;
  animation: cursor-blink 1s infinite;
}

.thinking-text {
  font-size: 0.875rem;
  color: #304270;
  font-weight: bold;
  font-style: italic;
}

.blinking-cursor {
  animation: blink 1.2s steps(2, start) infinite;
}

@keyframes blink {
  to {
    visibility: hidden;
  }
}

@keyframes cursor-blink {
  0%,
  50% {
    border-color: #490035;
  }
  51%,
  100% {
    border-color: transparent;
  }
}

/* Controls */
.controls-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-input {
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 4px solid black;
  width: 90%;
  background-color: #f1a1e0;
  color: #490046;
  font-family: "Courier New", monospace;
  font-size: 0.875rem;
  transition: all 0.2s;
  font-weight: bold;
}

.control-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px #490032;
}

.control-input:hover:not(:disabled) {
  background-color: #f5b5ea;
}

.control-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-input::placeholder {
  color: #31122a;
}

/* Buttons */
.button-group {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #ff72de;
  color: #250555;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  border: 4px solid black;
  font-family: "Courier New", monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  position: relative;
  font-weight: bold;
}

.btn-primary:hover:not(:disabled) {
  background-color: #6d0050;
  transform: scale(1.05);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.95);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #9ff922;
  color: #254900;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  border: 4px solid black;
  font-family: "Courier New", monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f5efb5;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  animation: spin 1s linear infinite;
}

.spinner-circle {
  opacity: 0.25;
}

.spinner-path {
  opacity: 0.75;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Error message */
.error-message {
  margin-top: 0.5rem;
  color: #dc2626;
  font-size: 0.75rem;
  background-color: #fee2e2;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #fecaca;
}

/* Stats counter */
.stats-counter {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #254900;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 400px) {
  .gameboy-container {
    width: 95vw;
    max-width: 350px;
  }
}
</style>
