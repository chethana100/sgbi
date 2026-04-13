"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface LocationContextType {
    selectedLocationId: string | null;
    selectedLocationName: string;
    setLocation: (id: string | null, name: string) => void;
}

const LocationContext = createContext<LocationContextType>({
    selectedLocationId: null,
    selectedLocationName: "Global",
    setLocation: () => { },
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [selectedLocationName, setSelectedLocationName] = useState("Global");

    useEffect(() => {
        const savedId = localStorage.getItem("preferred_location_id");
        const savedName = localStorage.getItem("preferred_location_name");
        if (savedId) setSelectedLocationId(savedId);
        if (savedName) setSelectedLocationName(savedName);
    }, []);

    const setLocation = (id: string | null, name: string) => {
        setSelectedLocationId(id);
        setSelectedLocationName(name);
        if (id) {
            localStorage.setItem("preferred_location_id", id);
            localStorage.setItem("preferred_location_name", name);
        } else {
            localStorage.removeItem("preferred_location_id");
            localStorage.removeItem("preferred_location_name");
        }
    };

    return (
        <LocationContext.Provider value={{ selectedLocationId, selectedLocationName, setLocation }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    return useContext(LocationContext);
}