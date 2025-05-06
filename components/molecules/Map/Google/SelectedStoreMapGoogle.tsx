import { useSuccessBookingCartInfoState } from 'lib/state/cart'
import { useCartStoreState } from 'lib/state/store'
import { useConfig } from 'lib/sdk/hooks/useConfig'
import { MapStore } from 'components/molecules/Map/Google/MapStore'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import React from 'react'

const containerStyle = {
    width: '100%',
    height: '100%',
}

export const SelectedStoreMapGoogle = () => {
    const { googleMapsApiAccessToken } = useConfig()
    const successBookingCartInfo = useSuccessBookingCartInfoState()
    const cartStore = useCartStoreState()
    const selectedStore = cartStore ?? successBookingCartInfo?.store

    const { isLoaded } = useJsApiLoader({
        id: 'selected-store-google-map-script',
        googleMapsApiKey: googleMapsApiAccessToken,
    })

    const [map, setMap] = React.useState<google.maps.Map | null>(null)

    const onLoad = React.useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(mapInstance)
    }, [])

    const onUnmount = React.useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(null)
    }, [])

    const defaultCenter = { lat: selectedStore?.lat ?? 0, lng: selectedStore?.lng ?? 0 }
    const defaultZoom = 14

    if (!isLoaded || !selectedStore) return <div>Loading Map...</div>

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={defaultZoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                fullscreenControl: false,
                gestureHandling: 'greedy',
                clickableIcons: false,
                zoomControl: false,
            }}
        >
            <Marker position={{ lat: selectedStore.lat, lng: selectedStore.lng }}>
                <MapStore
                    key={'MapStore' + selectedStore.location.id}
                />
            </Marker>
        </GoogleMap>
    )
}
