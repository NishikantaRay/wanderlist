import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, FormGroup, FormLabel, FormControl, FormText } from 'react-bootstrap';
import { MapPin, RefreshCw, FileJson, Route as RouteIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

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
    L.Marker.prototype.options.icon = defaultIcon; // Apply to all markers

    // Effect for initializing the map and marker layer group (runs once on mount)
    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map('map').setView([12.9716, 77.5946], 11); // Bengaluru
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapRef.current);

            // Initialize the feature group for markers and add it to the map
            markersLayerRef.current = L.featureGroup().addTo(mapRef.current);
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
        };
    }, []); // Empty dependency array means this runs once on mount, cleans up on unmount

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
        // This handles cases where points change, or one becomes null
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
        // This is a failsafe to ensure the control is removed if the effect re-runs or component unmounts
        return () => {
            if (mapRef.current && routingControlRef.current) {
                mapRef.current.removeControl(routingControlRef.current);
                routingControlRef.current = null;
            }
        };
    }, [startPoint, endPoint, places,routeTrigger]); // Dependencies for this effect

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

        // Reset map view to Bengaluru's center
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

    return (
        <div className="p-4 bg-light min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded shadow-md p-4">
                <h1 className="text-3xl font-semibold text-center text-gray-800 mb-4">
                    WanderList Bengaluru
                </h1>

                <div className="text-center mb-4">
                    <Button variant="primary" onClick={refreshMap}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh Map
                    </Button>
                    <Button variant="outline-secondary" onClick={toggleImportForm} className="ml-2">
                        <FileJson className="mr-2 h-4 w-4" /> Import Data
                    </Button>
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