document.addEventListener("DOMContentLoaded", () => {
    //Variables para el juego
    let tiempo = 90;
    let timer; //Referencia al cronometro
    let correctas = 0;
    let incorrectas = 0;
    let tiemposRespuesta = []; //Lista de tiempos para cada respuesta, ARRAY
    let multiplicadores = Array.from({ length: 13 }, (_, i) => i + 6); //Tablas del 6 al 18
    let respuestaCorrecta = null;
    let inicioRespuesta = null;

    //Fondo dinámico, esta zona hace que el fondo del videojuego cambie
    const contenedor = document.getElementById("ContenedorVideojuego");
    const imagenes = [
        "/static/estilos/imagenes/Espacio.jpg",
        "/static/estilos/imagenes/Espacio2.jpg",
        "/static/estilos/imagenes/Espacio3.jpeg",
        "/static/estilos/imagenes/Espacio4.jpeg",
        "/static/estilos/imagenes/Espacio5.jpg"
    ];
    let index = 0;
    setInterval(() => {
        index = (index + 1) % imagenes.length;
        contenedor.style.backgroundImage = `url('${imagenes[index]}')`;
    }, 15000); //Cada 15 segundos



    //Forzar audio al dar clic
    const pantallaInicio = document.getElementById("botonInicio");
    pantallaInicio.addEventListener("click", () => {
        const audio = document.getElementById("VideojuegoAudio");
        audio.play();
        pantallaInicio.style.display = "none";
    });



    //Iniciar el juego, hace los cambios programados y utiliza las funciones del cronometro y cambio de pregunta.
    window.iniciarJuego = function () {
            correctas = 0;
            incorrectas = 0;
            tiemposRespuesta = [];


        document.getElementById("botonInicio").style.display = "none";
        document.getElementById("cronometro").style.display = "block";
        document.getElementById("preguntaContainer").style.display = "block";

        iniciarCronometro();
        nuevaPregunta();
    }



    function iniciarCronometro() {
        actualizarCronometro();
        timer = setInterval(() => {
            tiempo--;
            actualizarCronometro();
            if (tiempo <= 0) {
                clearInterval(timer);
                document.getElementById("preguntaTexto").textContent = "¡Tiempo terminado!";
                document.getElementById("opciones").innerHTML = "";


                    //Enviar datos aquí, funcion para jalar datos ala la DB
                    enviarDatosAJAX();

                    //Espera 4 segundos y vuelve al menú
            setTimeout(() => {
                document.getElementById("preguntaContainer").style.display = "none";
                document.getElementById("cronometro").style.display = "none";
                document.getElementById("botonInicio").style.display = "block";
                tiempo = 60; //Reiniciar tiempo
            }, 4000);
            }

        }, 1000); //Tiempo para actualizar cronometro
    }


    //Como funciona el cronometro al actualizarse.
    function actualizarCronometro() {
        let minutos = String(Math.floor(tiempo / 60)).padStart(2, '0');
        let segundos = String(tiempo % 60).padStart(2, '0');
        document.getElementById("cronometro").textContent = `${minutos}:${segundos}`;
    }




 
  
    function nuevaPregunta() {
        const num1 = multiplicadores[Math.floor(Math.random() * multiplicadores.length)];    //Genera un problema de multiplicación (de las tablas del 6 al 18).
        const num2 = Math.floor(Math.random() * 10) + 1;
        respuestaCorrecta = num1 * num2;
        document.getElementById("preguntaTexto").textContent = `¿Cuánto es ${num1} × ${num2}?`;

        const opcionesContainer = document.getElementById("opciones");   //Crea 4 botones con respuestas (una correcta y tres aleatorias).
        opcionesContainer.innerHTML = '';

        let respuestas = [respuestaCorrecta];
        while (respuestas.length < 4) {
            let err = Math.floor(Math.random() * 150) + 1;
            if (!respuestas.includes(err)) respuestas.push(err);
        }

        respuestas = respuestas.sort(() => Math.random() - 0.5);

        respuestas.forEach(resp => {  //Guarda el tiempo en que se mostró la pregunta.
            const btn = document.createElement("button");
            btn.textContent = resp;
            btn.onclick = () => verificarRespuesta(btn, resp);
            opcionesContainer.appendChild(btn);
        });


        inicioRespuesta = performance.now();  //Tiempo al mostrar pregunta
    }



    function verificarRespuesta(boton, seleccion) {
        const finRespuesta = performance.now();
        const tiempoRespuesta = (finRespuesta - inicioRespuesta) / 1000; //en segundos
        tiemposRespuesta.push(tiempoRespuesta);  //Guardamos tiempo real

        //Confirma si la respuesta es correcta en pantalla, y las suma en variables globales de arriba del codigo
        const botones = document.querySelectorAll("#opciones button");
        botones.forEach(b => b.disabled = true);

        if (seleccion === respuestaCorrecta) {
            boton.classList.add("correcta");
            correctas++;
        } else {
            boton.classList.add("incorrecta");
            incorrectas++;
            botones.forEach(b => {
                if (parseInt(b.textContent) === respuestaCorrecta) {
                    b.classList.add("correcta");
                }
            });
        }


        setTimeout(() => {
            if (tiempo > 0) nuevaPregunta();
        }, 1500);
    }


    //Calcula el tiempo promedio de respuesta del jugador.
    //Envía todos los datos al servidor Flask en formato JSON para guardarlos en la base de datos.
    function enviarDatosAJAX() {
    const tiempoPromedio = tiemposRespuesta.length > 0 
    ? parseFloat((tiemposRespuesta.reduce((a, b) => a + b) / tiemposRespuesta.length).toFixed(2))
    : 0;

    fetch('/api/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            respuestasCorrectas: correctas,
            respuestasIncorrectas: incorrectas,
            tiempoPromedioRespuesta: tiempoPromedio
        })
    })
    .then(res => res.json())
    .then(data => console.log('Datos enviados:', data))
    .catch(error => console.error('Error al enviar:', error));
}



});