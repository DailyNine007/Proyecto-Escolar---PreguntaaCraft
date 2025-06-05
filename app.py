from flask import Flask, render_template, request, jsonify
import pyodbc

app = Flask(__name__)

#Configura tu conexión a SQL Server (Tienes que cambiarlo segun en tu computadora o en tu sql server)
server = ''  
database = ''
username = ''
password = ''
connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'

#Ruta principal (menú)
@app.route('/')
def menu():
    return render_template('Menu.html')

#Ruta de Estadisticas (Sin esto la pagina no carga)
@app.route('/Estadisticas')
def mostrar_estadisticas():
    return render_template('Estadisticas.html')

#Ruta para el juego de matemáticas (Sin esto la pagina no carga)
@app.route('/Matematicas')
def matematicas():
    return render_template('Matematicas.html')


#Obtener estadisticas en la pagina de sql server
@app.route('/api/estadisticas')
def obtener_estadisticas():
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()

        #Obtener la última fila insertada en Estadisticas, esto solo trabaja sobre la tabla de Estadisticas, lo demas funciona dentro de SQL SERVER
        cursor.execute("""
            SELECT TOP 1 totalCorrectas, totalIncorrectas, tiempoPromedio, rango
            FROM Estadisticas
            ORDER BY idActualizacion DESC
        """)
        fila = cursor.fetchone()

        conn.close()

        if fila:
            datos = {
                "respuestasCorrectas": fila.totalCorrectas,
                "respuestasIncorrectas": fila.totalIncorrectas,
                "tiempoPromedioJuego": f"{fila.tiempoPromedio:.2f} s",
                "rangoJugador": fila.rango
            }
        else:
            datos = {
                "respuestasCorrectas": 0,
                "respuestasIncorrectas": 0,
                "tiempoPromedioJuego": "--:--",
                "rangoJugador": "Sin datos"
            }

        return jsonify(datos)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


#Ruta para registrar datos del juego en la base de datos (Al terminar la partida, los datos se mandan ala DB a travez de esta seccion de codigo en conjunto con JS)
@app.route('/api/registrar', methods=['POST'])
def registrar_datos():
    data = request.json

    respuestas_correctas = data.get('respuestasCorrectas')
    respuestas_incorrectas = data.get('respuestasIncorrectas')
    tiempo_promedio = data.get('tiempoPromedioRespuesta')

    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Matematicas (respuestasCorrectas, respuestasIncorrectas, tiempoPromedioRespuesta)
            VALUES (?, ?, ?)
        """, respuestas_correctas, respuestas_incorrectas, tiempo_promedio)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    

#Antes de iniciar el servidor tienes que escribir todas las instrucciones que deseas que tu programa ejectute


    

#Iniciar servidor
if __name__ == '__main__':
    app.run(debug=True)
