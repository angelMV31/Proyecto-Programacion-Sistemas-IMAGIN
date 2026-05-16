let variables = { vida: 1, puntos: 0 };
let mapaEscenas = {};

function actualizarInterfazStats() {
    // Buscar elementos por el ID en HTML
    const spanVida = document.getElementById("val-vida");
    const spanPuntos = document.getElementById("val-puntos");

    if (spanVida){
        spanVida.innerText = variables.vida;

        //Si la vida es baja, se muestra en rojo
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

        // Validaciones de tabla de errores
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
    if (!datos) return;

    // 1. Procesar comandos y capturar los anuncios que devuelven
    let mensajesDeComandos = procesarComandos(datos.comandos);

    // 2. Construir el texto final: Texto base + Anuncios
    // Usa "\n\n" para dar un espacio visual entre la historia y el aviso de puntos/vida
    let textoCompleto = datos.texto;
    if (mensajesDeComandos) {
        textoCompleto += "\n\n" + mensajesDeComandos;
    }

    // 3. Dibujar en pantalla
    document.getElementById("texto-escena").innerText = textoCompleto;
    
    // 4. Genera botones de opciones
    const contenedor = document.getElementById("opciones-contenedor");
    contenedor.innerHTML = "";

    datos.opciones.forEach(opt => {
        let btn = document.createElement("button");
        btn.className = "btn-opcion";
        btn.innerText = opt;
        btn.onclick = () => {
            let destino = opt.toLowerCase().trim().replace(/ /g, "_");
            if (mapaEscenas[destino]) {
                mostrarEscena(destino);
            } else {
                let keys = Object.keys(mapaEscenas);
                let sigIdx = keys.indexOf(nombre) + 1;
                if (keys[sigIdx]) mostrarEscena(keys[sigIdx]);
            }
        };
        contenedor.appendChild(btn);
    });
}

function procesarComandos(cmds) {
    let anuncios = []; // Para guardar los mensajes de DISPLAY extras

    cmds.forEach(c => {
        // Comando ADD
        if (c.startsWith("ADD")) {
            let p = c.split(" ");
            let variable = p[1].toLowerCase();
            let valor = parseInt(p[2]);
            if (variables.hasOwnProperty(variable)) {
                variables[variable] += valor;
            }
        }
        
        // Comando SET
        if (c.startsWith("SET")) {
            let p = c.split(" ");
            let variable = p[1].toLowerCase();
            let valor = parseInt(p[2]);
            if (variables.hasOwnProperty(variable)) {
                variables[variable] = valor;
            }
        }

        // CAPTURAR DISPLAY EXTRAS 
        // Solo guarda como anuncio si NO es el DISPLAY principal (o si quieres que se acumule)
        if (c.startsWith("DISPLAY") && !c.startsWith("DISPLAYEND")) {
            anuncios.push(c.replace("DISPLAY", "").trim());
        }

        if (c.startsWith("DISPLAYEND")) {
            alert("Fin de la historia: " + c.replace("DISPLAYEND", ""));
        }
    });

    actualizarInterfazStats();
    return anuncios.join("\n"); // Devolver los anuncios encontrados
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