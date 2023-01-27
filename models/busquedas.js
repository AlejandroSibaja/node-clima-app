const fs = require('fs');

const axios = require('axios');

class Busquedas {

    historial = [];
    dbPath = './db/database.json';

    constructor() {
        this.leerDB();
    }

    get paramsMapbox() {
        return {
            'access_token': process.env.MAPBOX_KEY,
            'language': 'es',
            'limit': 5
        }
    }

    get paramsWeatherMap() {
        return {
            'appid': process.env.OPENWEATHER_KEY,
            'lang': 'es',
            'limit': 5,
            'units': 'metric'
        }
    }

    get historialCapitalizado() {
        return this.historial.map( item => {
            
            const words = item.split(" ");

            for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].substr(1);
            }

            return words.join(" ");
        })

    }

    async ciudad( lugar = '' ) {
        try {
            // Petición http
            const instance = axios.create({
                baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${ lugar }.json`,
                params: this.paramsMapbox
            });

            const resp = await instance.get();
            return resp.data.features.map( lugar => ({
                id: lugar.id,
                nombre: lugar.place_name,
                lng: lugar.center[0],
                lat: lugar.center[1],
            }));

        } catch (error) {
            return []; // retornar los lujares
        }
    }

    async climaLugar( lat, lon ) {
        try {
            // Petición http
            const instance = axios.create({
                baseURL: `https://api.openweathermap.org/data/2.5/weather`,
                params: { ...this.paramsWeatherMap, lat, lon }
            });

            const resp = await instance.get();
            const { weather, main } = resp.data;

            return {
                desc: weather[0].description,
                min:  main.temp_min,
                max:  main.temp_max,
                temp: main.temp,
            }

            
        } catch (error) {
            console.log(error);
        }
    }

    agregarHistorial( lugar= '' ) {
        
        if( this.historial.includes( lugar.toLocaleLowerCase() ) ) {
            return;
        }
        this.historial = this.historial.slice(0,5);
        
        
        this.historial.unshift( lugar.toLocaleLowerCase() );

        // Grabar en DB
        this.guardarDB();
    }

    guardarDB() {

        const payload = {
            historial: this.historial
        };
        
        fs.writeFileSync( this.dbPath, JSON.stringify( payload ) );

    }

    leerDB() {

        if( !fs.existsSync( this.dbPath )) {
            return;
        }

        const info = fs.readFileSync( this.dbPath, {
            encoding: 'utf-8'
        });

        const data = JSON.parse( info );

        this.historial = data.historial;

    }

}


module.exports = Busquedas;