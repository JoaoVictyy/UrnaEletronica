const somTecla = new Audio("./sons/tecla.mp3");
const somConfirma = new Audio("./sons/confirma.mp3");
const somFim = new Audio("./sons/fim.mp3");

const etapas = [
    {
        cargo: "VEREADOR",
        tipo: "vereador",
        numeros: 5,
        candidatos: [
            { numero: "40677", nome: "Amanda Garcia", partido: "PCM - Partido Cabrito Meloso", foto: "./img/CabritaAmanda.png" },
            { numero: "40676", nome: "Nicóle Oliveira", partido: "PCM - Partido Cabrito Meloso", foto: "./img/CabritaNicole.png" },
            { numero: "11111", nome: "Gabriel Bispo", partido: "PMÇ - Partido Muruçus", foto: "img/vereador3.jpg" },
            { numero: "22222", nome: "Gustavo seila", partido: "PMÇ - Partido Muruçus", foto: "img/vereador4.jpg" }
        ]
    },
    {
        cargo: "PREFEITO",
        tipo: "prefeito",
        numeros: 2,
        candidatos: [
            { numero: "40", nome: "João Campos", partido: "PCM - Partido Cabrito Meloso", foto: "./img/CabritoMeloso.png" },
            { numero: "67", nome: "Sergio Issao", partido: "PMÇ - Partido Muruçus", foto: "img/prefeito2.jpg" }
        ]
    }
];

let etapaAtual = 0;
let numeroDigitado = "";
let votoBranco = false;

let votos = JSON.parse(localStorage.getItem("votosUrna")) || {
  vereador: { branco: 0, nulo: 0, candidatos: {} },
  prefeito: { branco: 0, nulo: 0, candidatos: {} }
};

function salvarVotos() {
  localStorage.setItem("votosUrna", JSON.stringify(votos));
}

const cargo = document.getElementById("cargo");
const numeros = document.getElementById("numeros");
const info = document.getElementById("info");

function iniciarEtapa() {
    let etapa = etapas[etapaAtual];

    cargo.innerText = etapa.cargo;
    numeroDigitado = "";
    votoBranco = false;

    numeros.innerHTML = "";
    info.innerHTML = "<p>Digite o número do candidato</p>";

    for (let i = 0; i < etapa.numeros; i++) {
        numeros.innerHTML += `<div class="numero-box"></div>`;
    }
}

function digitar(numero) {
    tocarSom("tecla");

    let etapa = etapas[etapaAtual];

    if (votoBranco) return;

    if (numeroDigitado.length < etapa.numeros) {
        numeroDigitado += numero;
        atualizarNumeros();
    }

    if (numeroDigitado.length === etapa.numeros) {
        verificarCandidato();
    }
}

function atualizarNumeros() {
    const boxes = document.querySelectorAll(".numero-box");

    boxes.forEach((box, index) => {
        box.innerText = numeroDigitado[index] || "";
    });
}
function verificarCandidato() {
    let etapa = etapas[etapaAtual];
    let candidato = etapa.candidatos.find(c => c.numero === numeroDigitado);

    if (candidato) {
        info.innerHTML = `
      <div class="candidato-layout">
        <div class="dados-candidato">
          <h3>${candidato.nome}</h3>
          <p>Partido: ${candidato.partido}</p>
          <p>Número: ${candidato.numero}</p>
        </div>

        <img class="foto-candidato" src="${candidato.foto}" alt="${candidato.nome}">
      </div>
    `;
    } else {
        info.innerHTML = `
      <h3>VOTO NULO</h3>
      <p>Número inexistente</p>
    `;
    }
}

function votarBranco() {
    numeroDigitado = "";
    votoBranco = true;

    document.querySelectorAll(".numero-box").forEach(box => {
        box.innerText = "";
    });

    info.innerHTML = `
    <h3>VOTO EM BRANCO</h3>
    <p>Aperte CONFIRMA para votar em branco</p>
  `;
}

function corrigir() {
    iniciarEtapa();
}



function confirmar() {
    tocarSom("confirma");
    let etapa = etapas[etapaAtual];
    let tipo = etapa.tipo;

    // Não deixa confirmar sem digitar nada
    if (!votoBranco && numeroDigitado.length === 0) {
        info.innerHTML = `
        <h3 style="color:red;">Digite o número do candidato</h3>
        <p>Ou aperte BRANCO para votar em branco.</p>
    `;
        return;
    }

    if (votoBranco) {
        votos[tipo].branco++;
    } else {
        let candidato = etapa.candidatos.find(c => c.numero === numeroDigitado);

        if (candidato) {
            if (!votos[tipo].candidatos[candidato.numero]) {
                votos[tipo].candidatos[candidato.numero] = 0;
            }

            votos[tipo].candidatos[candidato.numero]++;
        } else {
            votos[tipo].nulo++;
        }
    }

    salvarVotos();

    etapaAtual++;

    if (etapaAtual < etapas.length) {
        iniciarEtapa();
    } else {
        finalizarVotacao();
    }
}


function finalizarVotacao() {
    tocarSom("fim");

    cargo.innerText = "";
    numeros.innerHTML = "";

    info.innerHTML = `
    <h1 class="fim">FIM</h1>
    <p style="font-size: 20px; text-align:center;">Novo eleitor em 3 segundos...</p>
  `;

    document.querySelector(".rodape").style.display = "none";

    setTimeout(() => {
        etapaAtual = 0;
        document.querySelector(".rodape").style.display = "block";
        iniciarEtapa();
    }, 3000);
}

function calcularPrefeitoEleito() {
    const etapaPrefeito = etapas.find(e => e.tipo === "prefeito");

    let lista = etapaPrefeito.candidatos.map(candidato => {
        return {
            ...candidato,
            votos: votos.prefeito.candidatos[candidato.numero] || 0
        };
    });

    lista.sort((a, b) => b.votos - a.votos);

    return lista[0];
}

function calcularVereadoresEleitos() {
    const etapaVereador = etapas.find(e => e.tipo === "vereador");
    const vereadores = etapaVereador.candidatos;
    const vagas = 2;

    let listaVereadores = vereadores.map(candidato => {
        return {
            ...candidato,
            votos: votos.vereador.candidatos[candidato.numero] || 0
        };
    });

    let votosValidos = listaVereadores.reduce((total, candidato) => {
        return total + candidato.votos;
    }, 0);

    if (votosValidos === 0) {
        return {
            votosValidos: 0,
            quocienteEleitoral: 0,
            votosPorPartido: {},
            vagasPorPartido: {},
            eleitos: []
        };
    }

    let quocienteEleitoral = Math.floor(votosValidos / vagas);

    if (quocienteEleitoral < 1) {
        quocienteEleitoral = 1;
    }

    let votosPorPartido = {};

    listaVereadores.forEach(candidato => {
        if (!votosPorPartido[candidato.partido]) {
            votosPorPartido[candidato.partido] = 0;
        }

        votosPorPartido[candidato.partido] += candidato.votos;
    });

    let vagasPorPartido = {};

    for (let partido in votosPorPartido) {
        vagasPorPartido[partido] = Math.floor(votosPorPartido[partido] / quocienteEleitoral);
    }

    let vagasDistribuidas = Object.values(vagasPorPartido).reduce((total, valor) => {
        return total + valor;
    }, 0);

    while (vagasDistribuidas < vagas) {
        let melhorPartido = null;
        let melhorMedia = -1;

        for (let partido in votosPorPartido) {
            let media = votosPorPartido[partido] / (vagasPorPartido[partido] + 1);

            if (media > melhorMedia) {
                melhorMedia = media;
                melhorPartido = partido;
            }
        }

        vagasPorPartido[melhorPartido]++;
        vagasDistribuidas++;
    }

    let eleitos = [];

    for (let partido in vagasPorPartido) {
        let candidatosDoPartido = listaVereadores
            .filter(candidato => candidato.partido === partido)
            .sort((a, b) => b.votos - a.votos);

        let quantidadeVagas = vagasPorPartido[partido];

        eleitos.push(...candidatosDoPartido.slice(0, quantidadeVagas));
    }

    eleitos = eleitos.slice(0, vagas);

    return {
        votosValidos,
        quocienteEleitoral,
        votosPorPartido,
        vagasPorPartido,
        eleitos
    };
}
function mostrarResultado() {
    const prefeitoEleito = calcularPrefeitoEleito();
    const vereadores = calcularVereadoresEleitos();

    const candidatosPrefeito = etapas.find(e => e.tipo === "prefeito").candidatos;
    const candidatosVereador = etapas.find(e => e.tipo === "vereador").candidatos;

    let totalPrefeito = candidatosPrefeito.reduce((total, c) => {
        return total + (votos.prefeito.candidatos[c.numero] || 0);
    }, 0);

    let html = "";

    html += `
    <div class="card-resultado eleito">
      <h2>Prefeito Eleito</h2>
      <h3>${prefeitoEleito.nome}</h3>
      <p>Partido: ${prefeitoEleito.partido}</p>
      <p>Votos: ${prefeitoEleito.votos}</p>
    </div>
  `;

    html += `<div class="card-resultado"><h2>Gráfico - Prefeito</h2>`;

    candidatosPrefeito.forEach(c => {
        let qtd = votos.prefeito.candidatos[c.numero] || 0;
        let porcentagem = totalPrefeito === 0 ? 0 : (qtd / totalPrefeito) * 100;

        html += `
      <p><strong>${c.nome}</strong> - ${qtd} voto(s)</p>
      <div class="barra">
        <div class="barra-preenchida" style="width: ${porcentagem}%"></div>
      </div>
    `;
    });

    html += `
    <p>Brancos: ${votos.prefeito.branco}</p>
    <p>Nulos: ${votos.prefeito.nulo}</p>
  </div>`;

    html += `<div class="card-resultado"><h2>Gráfico - Vereadores</h2>`;

    candidatosVereador.forEach(c => {
        let qtd = votos.vereador.candidatos[c.numero] || 0;
        let porcentagem = vereadores.votosValidos === 0 ? 0 : (qtd / vereadores.votosValidos) * 100;

        html += `
      <p><strong>${c.nome}</strong> (${c.partido}) - ${qtd} voto(s)</p>
      <div class="barra">
        <div class="barra-preenchida" style="width: ${porcentagem}%"></div>
      </div>
    `;
    });

    html += `
    <p>Brancos: ${votos.vereador.branco}</p>
    <p>Nulos: ${votos.vereador.nulo}</p>
    <p>Quociente eleitoral: ${vereadores.quocienteEleitoral}</p>
  </div>`;

    html += `<div class="card-resultado eleito"><h2>Vereadores Eleitos</h2>`;

    if (vereadores.eleitos.length === 0) {
        html += `<p>Nenhum vereador eleito.</p>`;
    } else {
        vereadores.eleitos.forEach(c => {
            html += `<p><strong>${c.nome}</strong> (${c.partido}) - ${c.votos} voto(s)</p>`;
        });
    }

    html += `</div>`;

    document.getElementById("resultadoConteudo").innerHTML = html;
    document.getElementById("modalResultado").classList.add("ativo");
}

function tocarSom(tipo){

    let som;


    if(tipo === "tecla"){
        som = somTecla;
    }
    
    if(tipo === "confirma"){
        som = somConfirma;
    }


    if(tipo === "fim"){
        som = somFim;
    }

    if(!som) return;

    som.pause();
    som.currentTime = 0;

    som.play().catch(()=>{});

}

function fecharResultado() {
    document.getElementById("modalResultado").classList.remove("ativo");
}

const SENHA = "276969"; 
function abrirSenha(){

    document.getElementById("modalSenha").classList.add("ativo");

    document.getElementById("inputSenha").value="";

    document.getElementById("inputSenha").focus();

}

function fecharSenha(){

    document.getElementById("modalSenha").classList.remove("ativo");

}

function verificarSenha(){

    const input=document.getElementById("inputSenha");

    if(input.value===SENHA){

        fecharSenha();

        mostrarResultado();

    }else{

        input.value="";

        input.classList.add("erroSenha");

        setTimeout(()=>{
            input.classList.remove("erroSenha");
        },300);

    }

}

document.addEventListener("keydown",(e)=>{

    if(
        document.getElementById("modalSenha").classList.contains("ativo")
        && e.key==="Enter"
    ){
        verificarSenha();
    }

});

function zerarEleicao() {
  const senha = prompt("Digite a senha para zerar a eleição:");

  if (senha !== SENHA) {
    alert("Senha incorreta!");
    return;
  }

  votos = {
    vereador: { branco: 0, nulo: 0, candidatos: {} },
    prefeito: { branco: 0, nulo: 0, candidatos: {} }
  };

  localStorage.removeItem("votosUrna");

  alert("Eleição zerada com sucesso!");
}

function abrirPainelCandidatos() {
  const etapa = etapas[etapaAtual];
  const painel = document.getElementById("painelLateral");
  const lista = document.getElementById("listaPainelCandidatos");
  const titulo = document.getElementById("tituloPainel");

  titulo.innerText = `Candidatos a ${etapa.cargo}`;

  let html = "";

  etapa.candidatos.forEach(c => {
    html += `
      <div class="card-lateral">
        <img src="${c.foto}" alt="${c.nome}">
        <h3>${c.nome}</h3>
        <p>${c.partido}</p>
        <p class="numero">${c.numero}</p>
      </div>
    `;
  });

  lista.innerHTML = html;
  painel.classList.add("ativo");
}

function fecharPainelCandidatos() {
  document.getElementById("painelLateral").classList.remove("ativo");
}

iniciarEtapa();
