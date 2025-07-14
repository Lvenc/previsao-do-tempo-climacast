const apiKey = "10feb69ce9e0ec2483f4dd6aadb3521c";


const elements = {
  weatherBox: document.getElementById("weather-box"),
  errorMessage: document.getElementById("error-message"),
  input: document.getElementById("city-input"),
  button: document.getElementById("search-btn"),
  spinner: document.getElementById("loading-spinner"),
  forecast5days: document.getElementById("forecast-5days"),
  forecastCards: document.getElementById("forecast-cards"),
  btnVoltar: document.getElementById("btn-voltar"),
  themeToggle: document.getElementById("theme-toggle"),
  locationName: document.getElementById("location-name"),
  weatherIcon: document.getElementById("weather-icon"),
  weatherDesc: document.getElementById("weather-description"),
  tempCurrent: document.getElementById("temp-current"),
  tempFeels: document.getElementById("temp-feels"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind")
};

// ========== GERENCIAMENTO DE TEMA ========== //
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark-mode";
  document.body.classList.add(savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  elements.themeToggle.innerHTML = theme === "light-mode" 
    ? '<i class="fas fa-sun" style="color: #f59e0b"></i>' 
    : '<i class="fas fa-moon"></i>';
}

elements.themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");
  
  const currentTheme = document.body.classList.contains("light-mode") 
    ? "light-mode" 
    : "dark-mode";
  
  localStorage.setItem("theme", currentTheme);
  updateThemeIcon(currentTheme);
  
  // Atualiza visualização se já houver dados
  if (!elements.weatherBox.classList.contains("hidden")) {
    refreshWeatherDisplay();
  }
});

// ========== FUNÇÕES AUXILIARES ========== //
function formatarDoisDigitos(numero) {
  return numero.toString().padStart(2, '0');
}

function calcularProbabilidadeChuva(previsaoDia) {
  // Encontra a probabilidade de chuva (pop) ou retorna 0 se não houver
  return previsaoDia.pop ? Math.round(previsaoDia.pop * 100) : 0;
}

// ========== GERENCIAMENTO DE CLIMA ========== //
function resetUI() {
  elements.weatherBox.classList.add("hidden");
  elements.forecast5days.classList.add("hidden");
  elements.errorMessage.classList.add("hidden");
  elements.btnVoltar.classList.add("hidden");
  elements.input.value = "";
}

async function buscarClima() {
  const cidade = elements.input.value.trim();

  if (!cidade) {
    mostrarErro("Por favor, digite o nome da cidade.");
    return;
  }

  resetUI();
  elements.spinner.classList.remove("hidden");

  try {
    const [resAtual, res5dias] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade},BR&appid=${apiKey}&lang=pt_br&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cidade},BR&appid=${apiKey}&lang=pt_br&units=metric`)
    ]);

    if (!resAtual.ok || !res5dias.ok) {
      throw new Error("Erro na resposta da API");
    }

    const [dadosAtual, dados5dias] = await Promise.all([
      resAtual.json(),
      res5dias.json()
    ]);

    if (dadosAtual.cod === "404") {
      mostrarErro("Cidade não encontrada. Verifique o nome.");
      return;
    }

    mostrarDadosClima(dadosAtual);
    mostrarPrevisao5Dias(dados5dias);
    elements.btnVoltar.classList.remove("hidden");

  } catch (erro) {
    console.error("Erro:", erro);
    mostrarErro(erro.message || "Erro ao buscar dados. Tente novamente.");
  } finally {
    elements.spinner.classList.add("hidden");
  }
}

function refreshWeatherDisplay() {
  if (elements.input.value.trim()) {
    buscarClima();
  }
}

function mostrarDadosClima(dados) {
  elements.weatherBox.classList.remove("hidden");
  
  elements.locationName.textContent = `${dados.name}, ${dados.sys.country}`;
  elements.weatherIcon.src = `https://openweathermap.org/img/wn/${dados.weather[0].icon}@4x.png`;
  elements.weatherIcon.alt = dados.weather[0].description;
  elements.weatherDesc.textContent = dados.weather[0].description;
  
  elements.tempCurrent.innerHTML = `<i class="fas fa-temperature-high"></i> ${dados.main.temp.toFixed(1)}°C`;
  elements.tempFeels.innerHTML = `<i class="fas fa-hand-holding-water"></i> Sensação: ${dados.main.feels_like.toFixed(1)}°C`;
  
  elements.humidity.textContent = dados.main.humidity;
  elements.wind.textContent = (dados.wind.speed * 3.6).toFixed(1);
}

function mostrarPrevisao5Dias(dados) {
  elements.forecastCards.innerHTML = "";
  const diasUnicos = [...new Set(dados.list.map(item => item.dt_txt.split(" ")[0]))].slice(0, 5);

  diasUnicos.forEach(dia => {
    const previsaoDia = dados.list.find(item => item.dt_txt.includes(`${dia} 12:00:00`)) || dados.list[0];
    const data = new Date(dia);
    const diaMes = `${formatarDoisDigitos(data.getDate())}/${formatarDoisDigitos(data.getMonth() + 1)}`;
    const probabilidadeChuva = calcularProbabilidadeChuva(previsaoDia);
    
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <div class="date-container">
        <div class="weekday">${data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</div>
        <div class="day-month">${diaMes}</div>
      </div>
      <img src="https://openweathermap.org/img/wn/${previsaoDia.weather[0].icon}@2x.png" alt="${previsaoDia.weather[0].description}">
      <div class="temp">${previsaoDia.main.temp.toFixed(1)}°C</div>
      <div class="rain-prob">
        <i class="fas fa-tint"></i> ${probabilidadeChuva}%
      </div>
    `;
    
    elements.forecastCards.appendChild(card);
  });

  elements.forecast5days.classList.remove("hidden");
}

function mostrarErro(msg) {
  elements.errorMessage.textContent = msg;
  elements.errorMessage.classList.remove("hidden");
}

// ========== EVENT LISTENERS ========== //
elements.button.addEventListener("click", buscarClima);
elements.input.addEventListener("keydown", (e) => e.key === "Enter" && buscarClima());
elements.btnVoltar.addEventListener("click", resetUI);

// ========== INICIALIZAÇÃO ========== //
window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  resetUI();
  elements.input.focus();
});
