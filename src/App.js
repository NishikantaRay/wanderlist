import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'react-bootstrap';
import { Form, FormGroup, FormLabel, FormControl, FormText } from 'react-bootstrap';
import { MapPin, RefreshCw, File, FileJson } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'bootstrap/dist/css/bootstrap.min.css';

const WanderListBengaluru = () => {
    const [places, setPlaces] = useState([]);
    const [destinationName, setDestinationName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const mapRef = useRef(null);
    const [importData, setImportData] = useState('');
    const [isImportFormVisible, setIsImportFormVisible] = useState(false);

    // Define marker icons directly, this fixes the broken image issue.
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

    useEffect(() => {
        // Initialize the map
        if (!mapRef.current) {
            mapRef.current = L.map('map').setView([12.9716, 77.5946], 11); // Bengaluru
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapRef.current);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        //render markers
        if (mapRef.current) {
            // Clear existing markers
            mapRef.current.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapRef.current.removeLayer(layer);
                }
            });

            // Add markers for each place
            places.forEach((place) => {
                L.marker([place.latitude, place.longitude])
                    .addTo(mapRef.current)
                    .bindPopup(`<b>${place.name}</b><br>${place.description}`)
                    .addTo(mapRef.current);
            });
        }
    }, [places]);

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
        if (mapRef.current) {
            // Clear existing markers
            mapRef.current.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapRef.current.removeLayer(layer);
                }
            });
            mapRef.current.setView([12.9716, 77.5946], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapRef.current);

            places.forEach((place) => {
                L.marker([place.latitude, place.longitude])
                    .addTo(mapRef.current)
                    .bindPopup(`<b>${place.name}</b><br>${place.description}`)
                    .addTo(mapRef.current);
            });
        }
    };

    const handleImport = useCallback(() => {
        try {
            const importedPlaces = JSON.parse(importData);
            if (Array.isArray(importedPlaces)) {
                let validPlaces = [];
                for (const place of importedPlaces) {
                    if (
                        typeof place.name === 'string' &&
                        typeof place.latitude === 'number' &&
                        typeof place.longitude === 'number' &&
                        typeof place.description === 'string' &&
                        !isNaN(place.latitude) &&
                        place.latitude >= -90 &&
                        place.latitude <= 90 &&
                        !isNaN(place.longitude) &&
                        place.longitude >= -180 &&
                        place.longitude <= 180
                    ) {
                        validPlaces.push({
                            name: place.name,
                            latitude: place.latitude,
                            longitude: place.longitude,
                            description: place.description,
                        });
                    } else {
                        console.warn('Invalid place object:', place);
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
                setError('Invalid JSON:  Please check the format of your JSON data.');
            } else {
                setError('Error importing data.  Please check the data and try again.');
            }

        }
    }, [importData]);

    const toggleImportForm = () => {
        setIsImportFormVisible(!isImportFormVisible);
        setError('');
        setImportData('');
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
                                Paste an array of place objects in JSON format.  Each object should have:
                                 name (string), latitude (number), longitude (number), and description (string).
                            </FormText>
                        </FormGroup>
                        {error && <p className="text-danger">{error}</p>}
                        <Button variant="success" onClick={handleImport}>Import</Button>
                        <Button variant="outline-danger" onClick={toggleImportForm} className="ml-2">Cancel</Button>
                    </div>
                )}

                <div id="map" className="rounded mb-4" style={{ height: '400px' }}></div>

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
            </div>
        </div>
    );
};

export default WanderListBengaluru;
