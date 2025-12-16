import { useState, useEffect } from "react";

const TIMEZONES = [
    { country: "Chile", zone: "America/Santiago", flag: "🇨🇱" },
    { country: "Perú", zone: "America/Lima", flag: "🇵🇪" },
    { country: "Colombia", zone: "America/Bogota", flag: "🇨🇴" },
];

export default function RelojPaises() {
    const [times, setTimes] = useState({});

    useEffect(() => {
        const updateTimes = () => {
            const newTimes = {};
            const now = new Date();

            TIMEZONES.forEach(({ country, zone }) => {
                try {
                    // Calculate time locally using the browser's Intl API
                    // This is reliable and doesn't depend on external APIs
                    const timeString = now.toLocaleTimeString("es-ES", {
                        timeZone: zone,
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                    });
                    newTimes[country] = timeString;
                } catch (error) {
                    console.error(`Error formatting time for ${country}:`, error);
                    newTimes[country] = "--:--";
                }
            });

            setTimes(newTimes);
        };

        // Update immediately
        updateTimes();

        // Update every second to keep it accurate
        const interval = setInterval(updateTimes, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex gap-4 text-sm font-semibold text-gray-300 mr-4">
            {TIMEZONES.map(({ country, flag }) => (
                <div key={country} className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                    <span role="img" aria-label={country}>{flag}</span>
                    <span className="hidden md:inline">{country}:</span>
                    <span className="text-white">{times[country] || "--:--"}</span>
                </div>
            ))}
        </div>
    );
}
