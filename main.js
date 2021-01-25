/*global fetch DOMParser*/

//定数の定義
const API_URL = "https://api.openweathermap.org/data/2.5/onecall";
const API_KEY = "a7e9d3122431d6b00deeb26b66ccf174";
const CITY_INFO = [{
        "id": 2110556,
        "name": "山形",
        "state": "",
        "country": "JP",
        "coord": {
            "lon": 140.3633,
            "lat": 38.2406
        }
    }, {
        "id": 1850147,
        "name": "東京",
        "state": "",
        "country": "JP",
        "coord": {
            "lon": 139.6917,
            "lat": 35.6895
        }
    },
    {
        "id": 1862636,
        "name": "彦根",
        "state": "",
        "country": "JP",
        "coord": {
            "lon": 136.25,
            "lat": 35.25
        }
    },
    {
        "id": 1861450,
        "name": "伊勢",
        "state": "",
        "country": "JP",
        "coord": {
            "lon": 136.7000,
            "lat": 34.4833
        }
    }
];

let state = {
    displayCities: []
};


window.onload = function() {
    //ボタンへのリスナ追加
    let btnddCity = document.getElementById("btn_add_city");
    btnddCity.addEventListener("click", onClickAddCity)

    let btnCancelAddCity = document.getElementById('add_city_modal_cancel');
    btnCancelAddCity.addEventListener('click', onClickCancelAddCity)


    let btnOKAddCity = document.getElementById('add_city_modal_ok');
    btnOKAddCity.addEventListener('click', onClickOKAddCity)

    //ローカルストレージから表示対象の都市のidを取得する。
    //表示対象がある場合は、再描画する。
    updateWeatherForecast();
}

function onClickAddCity() {
    let addCityComboElement = document.getElementById("add_city_combo");
    //一旦は以下を全部消す。
    while (addCityComboElement.firstChild) {
        addCityComboElement.removeChild(addCityComboElement.firstChild);
    }
    //モーダルに表示する都市を取得する。
    //すでに表示対象となってる都市は除外する。
    let selectableCities = CITY_INFO.filter(city => !state.displayCities.map(x => x.id).includes(city.id))
    for (let city of selectableCities) {
        let optionElement = document.createElement("option");
        optionElement.value = city.id;
        optionElement.innerText = city.name;
        //選択要素を生成してモーダルに組み込む
        addCityComboElement.appendChild(optionElement);
    }

    let modal = document.getElementById('add_city_modal');
    modal.style.display = 'block';
}

function onClickCancelAddCity() {
    let modal = document.getElementById('add_city_modal');
    modal.style.display = 'none';

    //選択要素をモーダルから削除する。
}

function onClickOKAddCity() {
    //選択された値を取得する。
    let selectedCityId = document.getElementById("add_city_combo").value;
    state.displayCities.push(getCityObjectById(selectedCityId));
    //モーダルを閉じる
    let modal = document.getElementById('add_city_modal');
    modal.style.display = 'none';
    //表示対象を追加して画面再描画を行う。
    updateWeatherForecast();
}

function onClickDelteCity() {
    let deleteCityId = this.value;
    state.displayCities = state.displayCities.filter(city => city.id != deleteCityId);
    updateWeatherForecast();
}

function updateWeatherForecast() {
    let requests = [];
    //表示対象の都市を取得
    for (let i = 0; i < state.displayCities.length; i++) {
        let city = state.displayCities[i];
        requests.push(fetch(getWeatherQuery(city.coord.lat, city.coord.lon)));
    }

    Promise.all(requests).then((responses) => {
        for (let res of responses) {
            console.log(res);
            if (!res.ok) {
                throw new Error();
            }
        }

        return Promise.all(responses.map(x => x.json()));
    }).then(jsons => {
        let cityListElement = document.getElementById("city_list");
        while (cityListElement.firstChild) {
            cityListElement.removeChild(cityListElement.firstChild);
        }
        for (let i = 0; i < jsons.length; i++) {
            //表示するDOMを作成する。
            let city = getCityObjectByCoord(jsons[i].lat, jsons[i].lon);
            let cityElement = generateCityElement(city.name, city.id);
            console.log(cityElement);
            for (let j = 1; j < jsons[i].daily.length; j++) {
                let forecastElement = generateForecastElement(jsons[i].daily[j].dt * 1000, 
                jsons[i].daily[j].weather[0].icon, jsons[i].daily[j].temp.max, jsons[i].daily[j].temp.min);
                
                cityElement.getElementsByClassName("forecast_area")[0].appendChild(forecastElement.getElementsByClassName("forecast")[0]);
            }

            //要素を流し込む。
            cityListElement.appendChild(cityElement.getElementsByClassName("city")[0]);
        }
        
        let btnDeletes = document.getElementsByClassName("btn_delete");
        for(let button of btnDeletes) {
            button.addEventListener("click", onClickDelteCity);
        }
        console.log(jsons);
    });

}

function generateCityElement(cityname, cityid) {

    let cityElementHtml = '<div class="city">' +
        '<div class="city_header">' +
        '<div class="city_name">' + cityname + '</div>' +
        '<div class="delete_city">' +
        '<button class="btn_delete" value="' + cityid + '">X</button>' +
        '</div>' +
        '</div>' +
        '<div class="city_body">' +
        '<div class="forecast_area">' +
        '</div>' +
        '</div>' +
        '</div>';

    return new DOMParser().parseFromString(cityElementHtml, "text/html");


}

function generateForecastElement(dt, iconId, maxTemp, minTemp) {
    let datetime = new Date(dt);
    let month = datetime.getMonth() + 1;
    let date = datetime.getDate();
    let day = getJapaneseDay(datetime.getDay());
    let forecastHtml = '<div class="forecast">' +
        '<div class="day">' + month + '/' + date + '(' + day + ')</div>' +
        '<div class="forecast_image">' +
        '<img src="./img/' + iconId + '@2x.png">' +
        '</div>' +
        '<span class="temp"><span class="max_temp">' + maxTemp + '</span>/<span class="min_temp">' + minTemp + '</span></span>'
        '</div>';
    return new DOMParser().parseFromString(forecastHtml, "text/html");
}

function getWeatherQuery(lat, lon) {
    return API_URL + "?lat=" + lat + "&lon=" + lon + "&exclude=minutely,hourly&units=metric&lan=ja&appid=" + API_KEY;
}


function getJapaneseDay(day) {
    if (day == 0) {
        return "日";
    }
    else if (day == 1) {
        return "月";
    }
    else if (day == 2) {
        return "火";
    }
    else if (day == 3) {
        return "水";
    }
    else if (day == 4) {
        return "木";
    }
    else if (day == 5) {
        return "金";
    }
    else if (day == 6) {
        return "土";
    }
    else {
        throw Error("Invalid arg");
    }
}

function getCityObjectByCoord(lat, lon) {
    for (let i = 0; i < CITY_INFO.length; i++) {
        if (CITY_INFO[i].coord.lat == lat && CITY_INFO[i].coord.lon == lon) {
            return CITY_INFO[i];
        }
    }
}

function getCityObjectById(id) {
    for (let city of CITY_INFO) {
        if (city.id == id) {
            return city;
        }
    }
}
