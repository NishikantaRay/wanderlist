import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, FormGroup, FormLabel, FormControl, FormText } from 'react-bootstrap';
import { MapPin, RefreshCw, FileJson, Route as RouteIcon, Palette, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Import Leaflet Control Geocoder CSS and JS
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';

// Define map themes (tile layer URLs) - (No changes to this array from previous response)
const MAP_THEMES = [
    {
        name: "OpenStreetMap (Standard)",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Humanitarian OSM Standard (HOT)",
        url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
    },
    {
        name: "OpenTopoMap (Topographic)",
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    },
    {
        name: "Wikimedia Maps (Neutral)",
        url: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png",
        attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_terms_of_use">Wikimedia Maps</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "CyclOSM (Cycling-focused)",
        url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
        attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - OpenStreetMap bicycle map">CyclOSM</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Thunderforest Outdoors (Requires API Key)",
        url: "https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=YOUR_THUNDERFOREST_API_KEY",
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Thunderforest OpenCycleMap (Requires API Key)",
        url: "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=YOUR_THUNDERFOREST_API_KEY",
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Stadia Maps - Alidade Smooth (Requires API Key)",
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=YOUR_STADIA_API_KEY",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Stadia Maps - Alidade Smooth Dark (Requires API Key)",
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=YOUR_STADIA_API_KEY",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Stadia Maps - Stamen Toner (Requires API Key)",
        url: "https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png?api_key=YOUR_STADIA_API_KEY",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Stadia Maps - Stamen Watercolor (Requires API Key)",
        url: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.png?api_key=YOUR_STADIA_API_KEY",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
];

const WanderListBengaluru = () => {
    const [places, setPlaces] = useState([]);
    const [destinationName, setDestinationName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState(''); // General error state
    const mapRef = useRef(null);
    const markersLayerRef = useRef(null);
    const routingControlRef = useRef(null);
    const [importData, setImportData] = useState('');
    const [isImportFormVisible, setIsImportFormVisible] = useState(false);
    const [startPoint, setStartPoint] = useState('');
    const [endPoint, setEndPoint] = useState('');
    const [routeTrigger, setRouteTrigger] = useState(0);

    // State for map theme
    const [currentThemeUrl, setCurrentThemeUrl] = useState(MAP_THEMES[0].url);
    const currentTileLayerRef = useRef(null);

    // --- NEW EXTERNAL SEARCH FEATURE START ---
    const [externalSearchQuery, setExternalSearchQuery] = useState('');
    const [externalSearchError, setExternalSearchError] = useState(''); // Specific error for external search
    const externalSearchMarkerRef = useRef(null); // Ref to hold the marker for the external search result
    // --- NEW EXTERNAL SEARCH FEATURE END ---

    // Define marker icons directly (this part is fine and crucial)
    const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = defaultIcon;

    // --- NEW EXTERNAL SEARCH FUNCTION START ---
    const handleExternalSearch = async (event) => {
        event.preventDefault(); // Prevent page reload on form submission
        setExternalSearchError(''); // Clear previous search errors

        if (!externalSearchQuery.trim()) {
            setExternalSearchError('Please enter a location to search.');
            return;
        }

        if (!mapRef.current) {
            setExternalSearchError('Map is not initialized.');
            return;
        }

        try {
            const encodedQuery = encodeURIComponent(externalSearchQuery);
            // Nominatim API for geocoding
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`;

            const response = await fetch(url, {
                // It's good practice to provide a User-Agent for Nominatim requests
                headers: {
                    'User-Agent': 'WanderListBengaluruApp/1.0 (your-email@example.com)' // Replace with your actual email
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                const displayName = data[0].display_name;

                // Remove previous external search marker if it exists
                if (externalSearchMarkerRef.current) {
                    mapRef.current.removeLayer(externalSearchMarkerRef.current);
                }

                // Add a new marker for the search result
                externalSearchMarkerRef.current = L.marker([lat, lon], { icon: defaultIcon })
                    .bindPopup(`<b>Searched:</b> ${displayName}`)
                    .addTo(mapRef.current)
                    .openPopup(); // Automatically open the popup

                // Center map on the search result with a suitable zoom level
                mapRef.current.setView([lat, lon], 13);

                setExternalSearchQuery(''); // Clear the search input after successful search
            } else {
                setExternalSearchError('No results found for your search query. Try a different query.');
            }

        } catch (error) {
            console.error("Error during external search:", error);
            setExternalSearchError(`Failed to search: ${error.message}. Please check your query or network.`);
        }
    };
    // --- NEW EXTERNAL SEARCH FUNCTION END ---

    // Effect for initializing the map and marker layer group (runs once on mount)
    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map('map').setView([12.9716, 77.5946], 11);

            const defaultTheme = MAP_THEMES.find(theme => theme.url === currentThemeUrl) || MAP_THEMES[0];
            currentTileLayerRef.current = L.tileLayer(defaultTheme.url, {
                attribution: defaultTheme.attribution,
            }).addTo(mapRef.current);

            markersLayerRef.current = L.featureGroup().addTo(mapRef.current);

            // Leaflet Control Geocoder (internal map search)
            if (L.Control.Geocoder) {
                L.Control.geocoder({
                    collapsed: true,
                    position: 'topleft', // Position internal search on the top-left
                    geocoder: L.Control.Geocoder.nominatim(),
                    defaultMarkGeocode: true
                }).addTo(mapRef.current);
            } else {
                console.error("L.Control.Geocoder is not defined. Check leaflet-control-geocoder import.");
            }

            // Geolocation Logic
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;
                        mapRef.current.setView([userLat, userLng], 13);
                        console.log("Map centered on user's location:", userLat, userLng);
                    },
                    (error) => {
                        console.error("Error getting user location:", error.code, error.message);
                        let errorMessage = "Could not get your location. Map defaulting to Bengaluru.";
                        if (error.code === error.TIMEOUT) {
                            errorMessage = "Location request timed out. Trying again or defaulting to Bengaluru.";
                        } else if (error.code === error.PERMISSION_DENIED) {
                            errorMessage = "Location access denied. Map defaulting to Bengaluru.";
                        } else if (error.code === error.POSITION_UNAVAILABLE) {
                            errorMessage = "Your location is currently unavailable. Map defaulting to Bengaluru.";
                        }
                        alert(errorMessage);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                console.warn("Geolocation is not supported by your browser.");
                alert("Geolocation not supported. Map defaulting to Bengaluru.");
            }
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            markersLayerRef.current = null;
            routingControlRef.current = null;
            currentTileLayerRef.current = null;
            // --- NEW EXTERNAL SEARCH FEATURE CLEANUP ---
            if (externalSearchMarkerRef.current) {
                externalSearchMarkerRef.current = null; // Just nullify, map.remove() will handle layer removal
            }
            // --- END NEW EXTERNAL SEARCH FEATURE CLEANUP ---
        };
    }, []);

    // ... (rest of your useEffects for theme, markers, routing - no changes needed here) ...
    useEffect(() => {
        if (!mapRef.current || !currentTileLayerRef.current) {
            return;
        }
        mapRef.current.removeLayer(currentTileLayerRef.current);
        const newTheme = MAP_THEMES.find(theme => theme.url === currentThemeUrl) || MAP_THEMES[0];
        currentTileLayerRef.current = L.tileLayer(newTheme.url, {
            attribution: newTheme.attribution,
        }).addTo(mapRef.current);
    }, [currentThemeUrl]);

    useEffect(() => {
        if (!mapRef.current || !markersLayerRef.current) {
            return;
        }
        markersLayerRef.current.clearLayers();
        places.forEach((place) => {
            L.marker([place.latitude, place.longitude])
                .bindPopup(`<b>${place.name}</b><br>${place.description}`)
                .addTo(markersLayerRef.current);
        });
    }, [places]);

    useEffect(() => {
        if (!mapRef.current) {
            return;
        }
        if (routingControlRef.current) {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }
        if (startPoint && endPoint && startPoint !== endPoint) {
            const startPlace = places.find(p => p.name === startPoint);
            const endPlace = places.find(p => p.name === endPoint);

            if (startPlace && endPlace) {
                routingControlRef.current = L.Routing.control({
                    waypoints: [
                        L.latLng(startPlace.latitude, startPlace.longitude),
                        L.latLng(endPlace.latitude, endPlace.longitude)
                    ],
                    routeWhileDragging: true,
                    showAlternatives: false,
                    lineOptions: {
                        styles: [{ color: 'blue', opacity: 0.6, weight: 6 }]
                    },
                    altLineOptions: {
                        styles: [{ color: 'gray', opacity: 0.4, weight: 4 }]
                    },
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: true
                }).addTo(mapRef.current);
            }
        }
        return () => {
            if (mapRef.current && routingControlRef.current) {
                mapRef.current.removeControl(routingControlRef.current);
                routingControlRef.current = null;
            }
        };
    }, [startPoint, endPoint, places, routeTrigger]);

    const handleAddDestination = (event) => {
        event.preventDefault();
        setError('');

        const name = destinationName;
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const desc = description;

        let hasErrors = false;

        if (!name.trim()) {
            setError('Please enter a destination name.');
            hasErrors = true;
        }
        if (isNaN(lat) || lat < -90 || lat > 90) {
            setError('Please enter a valid latitude (-90 to 90).');
            hasErrors = true;
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            setError('Please enter a valid longitude (-180 to 180).');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        const newPlace = {
            name,
            latitude: lat,
            longitude: lng,
            description: desc,
        };

        setPlaces([...places, newPlace]);
        setDestinationName('');
        setLatitude('');
        setLongitude('');
        setDescription('');
    };

    const refreshMap = () => {
        if (!mapRef.current) {
            console.warn("Map not initialized, cannot refresh.");
            return;
        }

        if (markersLayerRef.current) {
            markersLayerRef.current.clearLayers();
        }

        if (routingControlRef.current) {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }

        // --- NEW EXTERNAL SEARCH FEATURE RESET ---
        if (externalSearchMarkerRef.current) {
            mapRef.current.removeLayer(externalSearchMarkerRef.current);
            externalSearchMarkerRef.current = null;
        }
        setExternalSearchQuery('');
        setExternalSearchError('');
        // --- END NEW EXTERNAL SEARCH FEATURE RESET ---

        mapRef.current.setView([12.9716, 77.5946], 11);
        setStartPoint('');
        setEndPoint('');
    };

    const handleImport = useCallback(() => {
        try {
            const importedPlaces = JSON.parse(importData);
            if (Array.isArray(importedPlaces)) {
                let validPlaces = [];
                for (const place of importedPlaces) {
                    if (
                        typeof place.name === 'string' && place.name.trim() !== '' &&
                        typeof place.latitude === 'number' && !isNaN(place.latitude) && place.latitude >= -90 && place.latitude <= 90 &&
                        typeof place.longitude === 'number' && !isNaN(place.longitude) && place.longitude >= -180 && place.longitude <= 180 &&
                        typeof place.description === 'string'
                    ) {
                        validPlaces.push({
                            name: place.name,
                            latitude: place.latitude,
                            longitude: place.longitude,
                            description: place.description,
                        });
                    } else {
                        console.warn('Invalid place object encountered during import, skipping:', place);
                    }
                }
                setPlaces(validPlaces);
                setError('');
                setImportData('');
                setIsImportFormVisible(false);
            } else {
                setError('Invalid JSON: Expected an array of places.');
            }
        } catch (e) {
            if (e instanceof SyntaxError) {
                setError('Invalid JSON: Please check the format of your JSON data.');
            } else {
                setError(`Error importing data: ${e.message}. Please check the data and try again.`);
            }
        }
    }, [importData]);

    const toggleImportForm = () => {
        setIsImportFormVisible(!isImportFormVisible);
        setError('');
        setImportData('');
    };

    const handleCalculateRoute = () => {
        if (mapRef.current && routingControlRef.current) {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }
        setRouteTrigger(prev => prev + 1);
    };

    const handleThemeChange = (e) => {
        setCurrentThemeUrl(e.target.value);
    };

    return (
        <div className="p-4 bg-light min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded shadow-md p-4">
                <h1 className="text-3xl font-semibold text-center text-gray-800 mb-4">
                    WanderList Bengaluru
                </h1>

                {/* --- NEW EXTERNAL SEARCH FEATURE JSX START --- */}
                <div className="bg-white rounded shadow-md p-4 mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 d-flex align-items-center">
                        <Search className="mr-2 h-4 w-4" /> External Place Search
                    </h2>
                    <Form onSubmit={handleExternalSearch}>
                        <FormGroup className="mb-3 d-flex">
                            <FormControl
                                type="text"
                                placeholder="Search for a place (e.g., 'Bengaluru Palace')"
                                value={externalSearchQuery}
                                onChange={(e) => setExternalSearchQuery(e.target.value)}
                                className="mr-2" // Add margin for spacing between input and button
                            />
                            <Button variant="info" type="submit">
                                Search
                            </Button>
                        </FormGroup>
                        {externalSearchError && <p className="text-danger">{externalSearchError}</p>}
                    </Form>
                </div>
                {/* --- NEW EXTERNAL SEARCH FEATURE JSX END --- */}


                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <FormGroup className="mb-0 d-flex align-items-center">
                            <FormLabel className="mb-0 mr-2"><Palette className="mr-1 h-4 w-4" /> Map Theme:</FormLabel>
                            <FormControl
                                as="select"
                                value={currentThemeUrl}
                                onChange={handleThemeChange}
                                style={{ width: 'auto' }}
                            >
                                {MAP_THEMES.map((theme) => (
                                    <option key={theme.url} value={theme.url}>
                                        {theme.name}
                                    </option>
                                ))}
                            </FormControl>
                        </FormGroup>
                    </div>
                    <div>
                        <Button variant="primary" onClick={refreshMap}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Map
                        </Button>
                        <Button variant="outline-secondary" onClick={toggleImportForm} className="ml-2">
                            <FileJson className="mr-2 h-4 w-4" /> Import Data
                        </Button>
                    </div>
                </div>

                {isImportFormVisible && (
                    <div className="bg-white rounded shadow-md p-4 mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Import Places Data</h2>
                        <FormGroup>
                            <FormLabel>JSON Data:</FormLabel>
                            <FormControl
                                as="textarea"
                                rows={8}
                                placeholder="Paste your JSON data here..."
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                            />
                            <FormText className="text-muted">
                                Paste an array of place objects in JSON format. Each object should have:
                                name (string), latitude (number), longitude (number), and description (string).
                            </FormText>
                        </FormGroup>
                        {error && <p className="text-danger">{error}</p>}
                        <Button variant="success" onClick={handleImport}>Import</Button>
                        <Button variant="outline-danger" onClick={toggleImportForm} className="ml-2">Cancel</Button>
                    </div>
                )}

                <div id="map" className="rounded mb-4" style={{ height: '400px' }}></div>

                {places.length > 1 && (
                    <div className="bg-white rounded shadow-md p-4 mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Calculate Route</h2>
                        <Form>
                            <FormGroup className="mb-3">
                                <FormLabel>Start Point:</FormLabel>
                                <FormControl
                                    as="select"
                                    value={startPoint}
                                    onChange={(e) => setStartPoint(e.target.value)}
                                >
                                    <option value="">Select a starting point</option>
                                    {places.map((place) => (
                                        <option key={place.name} value={place.name}>
                                            {place.name}
                                        </option>
                                    ))}
                                </FormControl>
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormLabel>End Point:</FormLabel>
                                <FormControl
                                    as="select"
                                    value={endPoint}
                                    onChange={(e) => setEndPoint(e.target.value)}
                                >
                                    <option value="">Select an ending point</option>
                                    {places.map((place) => (
                                        <option key={place.name} value={place.name}>
                                            {place.name}
                                        </option>
                                    ))}
                                </FormControl>
                            </FormGroup>
                            {startPoint && endPoint && startPoint === endPoint && (
                                <p className="text-warning">Start and end points cannot be the same.</p>
                            )}
                            {error && <p className="text-danger">{error}</p>}
                            <Button
                                variant="info"
                                onClick={handleCalculateRoute}
                                disabled={!startPoint || !endPoint || startPoint === endPoint}
                            >
                                <RouteIcon className="mr-2 h-4 w-4" /> Calculate Route
                            </Button>
                        </Form>
                    </div>
                )}

                <div className="bg-white rounded shadow-md p-4">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add New Place</h2>
                    <Form onSubmit={handleAddDestination} className="space-y-4">
                        <FormGroup>
                            <FormLabel>Destination Name:</FormLabel>
                            <FormControl
                                type="text"
                                placeholder="Enter destination name"
                                value={destinationName}
                                onChange={(e) => setDestinationName(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>Latitude:</FormLabel>
                            <FormControl
                                type="number"
                                placeholder="Enter latitude"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>Longitude:</FormLabel>
                            <FormControl
                                type="number"
                                placeholder="Enter longitude"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>Description:</FormLabel>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="Enter description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </FormGroup>
                        {error && <p className="text-danger">{error}</p>}
                        <Button type="submit" variant="success">
                            <MapPin className="mr-2 h-4 w-4" /> Add Destination
                        </Button>
                    </Form>
                </div>

                {places.length > 0 && (
                    <div className="mt-4 bg-white rounded shadow-md p-4">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your WanderList</h2>
                        <ul className="list-group">
                            {places.map((place, index) => (
                                <li key={index} className="list-group-item">
                                    <strong>{place.name}</strong> ({place.latitude}, {place.longitude}) - {place.description}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WanderListBengaluru;