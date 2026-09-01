export interface WeatherData {
  temperature: number;
  unit: string;
  cityName: string;
  weatherCode: number;
}

export async function fetchKarlsruheWeather(): Promise<WeatherData> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=49.0069&longitude=8.4037&current_weather=true'
    );
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    return {
      temperature: Math.round(data.current_weather.temperature * 10) / 10,
      unit: '°C',
      cityName: 'Karlsruhe',
      weatherCode: data.current_weather.weathercode,
    };
  } catch (error) {
    console.warn('Using fallback Karlsruhe temperature:', error);
    return {
      temperature: 21.6,
      unit: '°C',
      cityName: 'Karlsruhe',
      weatherCode: 2,
    };
  }
}
