let variables = { vida: 1, puntos: 0 };
let mapaEscenas = {};

function actualizarInterfazStats() {
    // Busca los elementos por el ID que ya tienes en tu HTML
    const spanVida = document.getElementById("val-vida");
    const spanPuntos = document.getElementById("val-puntos");

    if (spanVida){
        spanVida.innerText = variables.vida;

        // Feedback visual: Si la vida es baja, ponerla en rojo
        if (variables.vida <= 20) {
            spanVida.style.color = "#ff5555";
            spanVida.style.fontWeight = "bold";
        } else {
            spanVida.style.color = "white";
        }
    }

    if (spanPuntos){
        spanPuntos.innerText = variables.puntos;
    }
}

function compilarYJugar() {
    const codigo = document.getElementById("codigo-editor").value;
    const consola = document.getElementById("consola-robustez");
    const lineas = codigo.split("\n");
    
    // Reset de estado
    consola.innerHTML = "";
    mapaEscenas = {};
    variables = { vida: 100, puntos: 0 };

    actualizarInterfazStats();

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
            if (texto.startsWith("DISPLAY") && !texto.startsWith("DISPLAYEND")) {
                mapaEscenas[escenaActualRef].texto = texto.replace("DISPLAY", "").trim();
            } else if (texto.startsWith("OPTION")) {
                let contenido = texto.match(/\((.*?)\)/)[1];
                mapaEscenas[escenaActualRef].opciones = contenido.split(",").map(o => o.trim());
            } else if (texto.startsWith("ADD") || texto.startsWith("DISPLAYEND") || texto.startsWith("GOTO")) {
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
    if (!datos) return;

    let mensajeExtra = procesarComandos(datos.comandos, nombre);
   
    let textoFinal = datos.texto;

    if (mensajeExtra) {
        textoFinal += "\n\n" + mensajeExtra;
    }

    document.getElementById("texto-escena").innerText = textoFinal;
    
    actualizarInterfazStats();

    const contenedor = document.getElementById("opciones-contenedor");
    contenedor.innerHTML = "";

    datos.opciones.forEach(opt => {
        let btn = document.createElement("button");
        btn.className = "btn-opcion";
        btn.innerText = opt;
        btn.onclick = () => {
            // Convertimos el texto de la opción a un formato de ID (ej: "Ir al Norte" -> "ir_al_norte")
            let destino = opt.toLowerCase().trim().replace(/ /g, "_");
            
            if (mapaEscenas[destino]) {
                mostrarEscena(destino);
            } else {
                // Si no hay destino específico, buscamos la siguiente escena en la lista
                let keys = Object.keys(mapaEscenas);
                let sigIdx = keys.indexOf(nombre) + 1;
                if (keys[sigIdx]) mostrarEscena(keys[sigIdx]);
            }
        };
        contenedor.appendChild(btn);
    });
}

function procesarComandos(cmds, nombre) {
    let mensajeExtra = "";

    cmds.forEach(c => {
        // Comando ADD Suma o Resta vida del jugador
        if (c.startsWith("ADD")) {
            let p = c.split(" ");
            let variable = p[1].toLowerCase();
            let valor = parseInt(p[2]);
            if (variables.hasOwnProperty(variable)) {
                variables[variable] += valor;
            }
        }
        
        // Comando SET: Asigna un valor fijo (ej: SET vida 100)
        if (c.startsWith("SET")) {
            let p = c.split(" ");
            let variable = p[1].toLowerCase();
            let valor = parseInt(p[2]);
            if (variables.hasOwnProperty(variable)) {
                variables[variable] = valor;
            }
        }

        if (c.startsWith("GOTO")) {
            let destino = c.split(" ")[1];
            setTimeout(() => {
                if (mapaEscenas[destino]) mostrarEscena(destino);
            }, 5500);
        }

        if (c.startsWith("DISPLAYEND")) {
            let msg = c.replace("DISPLAYEND", "").trim();
            mensajeExtra = " " + msg;
            setTimeout(() => {
                document.getElementById("texto-escena").innerText = " " + msg;
                const contenedor = document.getElementById("opciones-contenedor");
                contenedor.innerHTML = "";
                let btn = document.createElement("button");
                btn.className = "btn-opcion";
                btn.innerText = "🔄 Volver a jugar";
                btn.onclick = () => compilarYJugar();

                contenedor.appendChild(btn);
            }, 5500);
        }

        return mensajeExtra;
    });

    // Actualizar la interfaz después de cambiar las variables
    actualizarInterfazStats();
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