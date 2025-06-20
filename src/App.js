import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, FormGroup, FormLabel, FormControl, FormText } from 'react-bootstrap';
import { MapPin, RefreshCw, FileJson, Route as RouteIcon, Palette, Search } from 'lucide-react'; // Added Search icon
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Import Leaflet Control Geocoder CSS and JS
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder'; // This directly extends L.Control

// Define map themes (tile layer URLs)
// This array now includes a broader range of OpenStreetMap-based and other free/freemium options.
const MAP_THEMES = [
    {
        name: "OpenStreetMap (Standard)",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Humanitarian OSM Standard (HOT)", // A slightly different, high-contrast OSM style
        url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
    },
    {
        name: "OpenTopoMap (Topographic)", // Excellent for hiking, showing elevation contours
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    },
    {
        name: "Wikimedia Maps (Neutral)", // A clean, neutral style often used by Wikipedia
        url: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png",
        attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_terms_of_use">Wikimedia Maps</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "CyclOSM (Cycling-focused)", // Highlights cycle paths and related infrastructure
        url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
        attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - OpenStreetMap bicycle map">CyclOSM</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Thunderforest Outdoors (Requires API Key)", // Good for outdoor activities, trails, etc.
        url: "https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=YOUR_THUNDERFOREST_API_KEY",
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Thunderforest OpenCycleMap (Requires API Key)", // Specifically for cycling, different details than CyclOSM
        url: "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=YOUR_THUNDERFOREST_API_KEY",
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Stadia Maps - Alidade Smooth (Requires API Key)", // Modern, light, and very clean aesthetic
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=YOUR_STADIA_API_KEY",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Stadia Maps - Alidade Smooth Dark (Requires API Key)", // Dark version of Alidade Smooth
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=YOUR_STADIA_API_KEY",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Stadia Maps - Stamen Toner (Requires API Key)", // A classic stark black & white minimalist map
        url: "https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png?api_key=YOUR_STADIA_API_KEY",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: "Stadia Maps - Stamen Watercolor (Requires API Key)", // An artistic, watercolor-painted look
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
    const [error, setError] = useState('');
    const mapRef = useRef(null);
    const markersLayerRef = useRef(null); // Ref for the marker layer group
    const routingControlRef = useRef(null); // Ref for routing control
    const [importData, setImportData] = useState('');
    const [isImportFormVisible, setIsImportFormVisible] = useState(false);
    const [startPoint, setStartPoint] = useState('');
    const [endPoint, setEndPoint] = useState('');
    const [routeTrigger, setRouteTrigger] = useState(0);

    // State for map theme
    const [currentThemeUrl, setCurrentThemeUrl] = useState(MAP_THEMES[0].url);
    const currentTileLayerRef = useRef(null); // Ref for the active tile layer instance

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

    // Effect for initializing the map and marker layer group (runs once on mount)
    useEffect(() => {
        if (!mapRef.current) {
            // Initialize the map with a default view (e.g., Bengaluru) first,
            // so something is displayed while waiting for geolocation.
            mapRef.current = L.map('map').setView([12.9716, 77.5946], 11); // Default to Bengaluru

            // Initialize the default tile layer and add it to the map
            const defaultTheme = MAP_THEMES.find(theme => theme.url === currentThemeUrl) || MAP_THEMES[0];
            currentTileLayerRef.current = L.tileLayer(defaultTheme.url, {
                attribution: defaultTheme.attribution,
            }).addTo(mapRef.current);

            // Initialize the feature group for markers and add it to the map
            markersLayerRef.current = L.featureGroup().addTo(mapRef.current);

            // --- Add Search Control (Leaflet Control Geocoder) ---
            // Ensure L.Control.Geocoder is available from the import
            if (L.Control.Geocoder) {
                L.Control.geocoder({
                    collapsed: true, // Keep the search control compact initially
                    position: 'topleft', // Position it on the top-left of the map
                    // Geocoder service (Nominatim is often default, but good to be explicit)
                    geocoder: L.Control.Geocoder.nominatim(),
                    defaultMarkGeocode: true // Let the control add its own marker for the searched location
                }).addTo(mapRef.current);
            } else {
                console.error("L.Control.Geocoder is not defined. Check leaflet-control-geocoder import.");
            }
            // --- End Search Control ---

            // --- Geolocation Logic ---
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;
                        // Set map view to user's location with a more zoomed-in view
                        mapRef.current.setView([userLat, userLng], 13); // Zoom level 13 is good for a city view
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
                        enableHighAccuracy: true, // Request more precise location
                        timeout: 10000,           // Timeout after 10 seconds
                        maximumAge: 0            // Don't use a cached position
                    }
                );
            } else {
                console.warn("Geolocation is not supported by your browser.");
                alert("Geolocation not supported. Map defaulting to Bengaluru.");
            }
            // --- End Geolocation Logic ---
        }

        // Cleanup function for this specific effect (runs on unmount)
        return () => {
            if (mapRef.current) {
                mapRef.current.remove(); // Remove the Leaflet map instance
                mapRef.current = null;    // Nullify the ref
            }
            // Also nullify other Leaflet-related refs to prevent stale references
            markersLayerRef.current = null;
            routingControlRef.current = null;
            currentTileLayerRef.current = null; // Clear tile layer ref too
        };
    }, []); // Empty dependency array means this runs once on mount, cleans up on unmount

    // Effect for handling map theme changes
    useEffect(() => {
        if (!mapRef.current || !currentTileLayerRef.current) {
            return; // Map or tile layer ref not initialized
        }

        // Remove the old tile layer from the map
        mapRef.current.removeLayer(currentTileLayerRef.current);

        // Get the new theme details
        const newTheme = MAP_THEMES.find(theme => theme.url === currentThemeUrl) || MAP_THEMES[0];

        // Create a new tile layer and add it to the map
        currentTileLayerRef.current = L.tileLayer(newTheme.url, {
            attribution: newTheme.attribution,
        }).addTo(mapRef.current);

    }, [currentThemeUrl]); // Re-run when the selected theme URL changes

    // Effect for rendering markers based on 'places' state (runs when places changes)
    useEffect(() => {
        // Ensure both map and the marker layer group are initialized before interacting
        if (!mapRef.current || !markersLayerRef.current) {
            return;
        }

        // Clear all existing markers from the feature group
        markersLayerRef.current.clearLayers();

        // Add new markers for each place to the feature group
        places.forEach((place) => {
            L.marker([place.latitude, place.longitude])
                .bindPopup(`<b>${place.name}</b><br>${place.description}`)
                .addTo(markersLayerRef.current); // Add to the feature group, not directly to map
        });
    }, [places]); // Re-run when places array changes

    // Effect for handling routing (runs when startPoint, endPoint, or places change)
    useEffect(() => {
        // Ensure map is initialized before attempting any routing operations
        if (!mapRef.current) {
            return;
        }

        // Always attempt to remove the existing routing control first
        if (routingControlRef.current) {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null; // Crucially, clear the ref after removing
        }

        // Only create a new route if both start and end points are valid and different
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

        // Cleanup function for this specific effect (runs before re-execution or on unmount)
        return () => {
            if (mapRef.current && routingControlRef.current) {
                mapRef.current.removeControl(routingControlRef.current);
                routingControlRef.current = null;
            }
        };
    }, [startPoint, endPoint, places, routeTrigger]); // Dependencies for this effect

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

        setPlaces([...places, newPlace]); // This state update will trigger the marker useEffect
        setDestinationName('');
        setLatitude('');
        setLongitude('');
        setDescription('');
    };

    const refreshMap = () => {
        // Guard against map not being initialized
        if (!mapRef.current) {
            console.warn("Map not initialized, cannot refresh.");
            return;
        }

        // Clear markers only if the marker layer group exists
        if (markersLayerRef.current) {
            markersLayerRef.current.clearLayers();
        }

        // Remove routing control only if it exists
        if (routingControlRef.current) {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null; // Crucially, clear the ref after removing
        }

        // Reset map view to Bengaluru's center (or default if geolocation fails again)
        mapRef.current.setView([12.9716, 77.5946], 11);

        // Reset routing selection states
        setStartPoint('');
        setEndPoint('');

        // No need to manually re-add markers here; changing `places` state
        // or importing data will trigger the marker `useEffect` automatically.
    };

    const handleImport = useCallback(() => {
        try {
            const importedPlaces = JSON.parse(importData);
            if (Array.isArray(importedPlaces)) {
                let validPlaces = [];
                for (const place of importedPlaces) {
                    // Robust validation for each place object
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
                setPlaces(validPlaces); // This will trigger the marker useEffect
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
        // This part is correct for clearing any existing route
        if (mapRef.current && routingControlRef.current) {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }
        // Increment the trigger state to force the useEffect to re-evaluate
        setRouteTrigger(prev => prev + 1);
    };

    // Handler for theme change dropdown
    const handleThemeChange = (e) => {
        setCurrentThemeUrl(e.target.value);
    };

    return (
        <div className="p-4 bg-light min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded shadow-md p-4">
                <h1 className="text-3xl font-semibold text-center text-gray-800 mb-4">
                    WanderList Bengaluru
                </h1>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div> {/* Left side: Theme dropdown */}
                        <FormGroup className="mb-0 d-flex align-items-center">
                            <FormLabel className="mb-0 mr-2"><Palette className="mr-1 h-4 w-4" /> Map Theme:</FormLabel>
                            <FormControl
                                as="select"
                                value={currentThemeUrl}
                                onChange={handleThemeChange}
                                style={{ width: 'auto' }} // Adjust width as needed
                            >
                                {MAP_THEMES.map((theme) => (
                                    <option key={theme.url} value={theme.url}>
                                        {theme.name}
                                    </option>
                                ))}
                            </FormControl>
                        </FormGroup>
                    </div>
                    <div> {/* Right side: Action buttons */}
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

                {places.length > 1 && ( // Only show routing options if there are at least two places
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