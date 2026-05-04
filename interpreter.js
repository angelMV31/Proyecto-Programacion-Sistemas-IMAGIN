let variables = { vida: 100, puntos: 0 };
let mapaEscenas = {};

function compilarYJugar() {
    const codigo = document.getElementById("codigo-editor").value;
    const consola = document.getElementById("consola-robustez");
    const lineas = codigo.split("\n");
    
    // Reset de estado
    consola.innerHTML = "";
    mapaEscenas = {};
    variables = { vida: 100, puntos: 0 };
    let hayError = false;

    // --- FASE 1: ESCUDO DE ROBUSTEZ ---
    let escenaActualRef = null;

    for (let i = 0; i < lineas.length; i++) {
        let texto = lineas[i].trim();
        if (!texto || texto.startsWith("#")) continue;

        // Validaciones de tu tabla de errores
        if (texto.startsWith("FORM")) {
            imprimirError(i+1, texto, "Comando 'FORM' no reconocido. ¿Quisiste decir 'FROM'?");
            hayError = true; break;
        }
        if (texto.startsWith("OPTION") && !texto.includes(",")) {
            imprimirError(i+1, texto, "Separación de variables errónea, coloca una coma ','.");
            hayError = true; break;
        }

        // --- FASE 2: CONSTRUCCIÓN DEL MUNDO VISUAL ---
        if (texto.startsWith("FROM")) {
            let nombre = texto.split(" ")[1];
            escenaActualRef = nombre;
            mapaEscenas[nombre] = { texto: "", opciones: [], comandos: [] };
        } else if (escenaActualRef) {
            if (texto.startsWith("DISPLAY")) {
                mapaEscenas[escenaActualRef].texto = texto.replace("DISPLAY", "").trim();
            } else if (texto.startsWith("OPTION")) {
                let contenido = texto.match(/\((.*?)\)/)[1];
                mapaEscenas[escenaActualRef].opciones = contenido.split(",").map(o => o.trim());
            } else if (texto.startsWith("ADD") || texto.startsWith("DISPLAYEND")) {
                mapaEscenas[escenaActualRef].comandos.push(texto);
            }
        }
    }

    if (!hayError) {
        consola.innerHTML = "<div style='color: #55ff55'>✅ Compilación exitosa. Robustez verificada.</div>";
        iniciarNavegacion();
    }
}

function iniciarNavegacion() {
    const primeraEscena = Object.keys(mapaEscenas)[0];
    if (primeraEscena) mostrarEscena(primeraEscena);
}

function mostrarEscena(nombre) {
    const datos = mapaEscenas[nombre];
    document.getElementById("texto-escena").innerText = datos.texto;
    
    // Actualizar Stats
    document.getElementById("val-vida").innerText = variables.vida;
    document.getElementById("val-puntos").innerText = variables.puntos;

    const contenedor = document.getElementById("opciones-contenedor");
    contenedor.innerHTML = "";

    datos.opciones.forEach(opt => {
        let btn = document.createElement("button");
        btn.className = "btn-opcion";
        btn.innerText = opt;
        btn.onclick = () => {
            // Lógica de navegación simple: busca la escena que coincida con la opción
            let destino = opt.toLowerCase().replace(/ /g, "_");
            procesarComandos(datos.comandos);
            if (mapaEscenas[destino]) mostrarEscena(destino);
            else {
                // Si no hay destino, buscamos la siguiente escena en el mapa por orden
                let keys = Object.keys(mapaEscenas);
                let sigIdx = keys.indexOf(nombre) + 1;
                if (keys[sigIdx]) mostrarEscena(keys[sigIdx]);
            }
        };
        contenedor.appendChild(btn);
    });
}

function procesarComandos(cmds) {
    cmds.forEach(c => {
        if (c.startsWith("ADD")) {
            let p = c.split(" ");
            let variable = p[1].toLowerCase();
            variables[variable] += parseInt(p[2]);
        }
        if (c.startsWith("DISPLAYEND")) {
            alert("Fin de la historia: " + c.replace("DISPLAYEND", ""));
        }
    });
}

function imprimirError(num, linea, msg) {
    const consola = document.getElementById("consola-robustez");
    consola.innerHTML += `
        <div class="error-titulo">Error en línea ${num}:</div>
        <div class="error-linea">${num} | ${linea}</div>
        <div style="color:#55ff55; margin-left:20px">^</div>
        <div class="error-sugerencia">${msg}</div>
    `;
}