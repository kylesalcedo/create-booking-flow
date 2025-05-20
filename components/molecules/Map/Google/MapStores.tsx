import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { MapStore } from 'components/molecules/Map/Google/MapStore'
import { Store } from 'lib/state/store/types'
import { useConfig } from 'lib/sdk/hooks/useConfig'
import { useMapViewportState } from 'lib/state/location'
import React from 'react'

interface Props {
    stores: Store[]
}

const containerStyle = {
    width: '100%',
    height: '100%',
}

export const MapStores = ({ stores }: Props) => {
    const { googleMapsApiAccessToken } = useConfig()
    const [globalViewport] = useMapViewportState()

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: googleMapsApiAccessToken,
    })

    const [map, setMap] = React.useState<google.maps.Map | null>(null)

    const onLoad = React.useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(mapInstance)
    }, [])

    const onUnmount = React.useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(null)
    }, [])

    const defaultCenter = { lat: globalViewport.latitude, lng: globalViewport.longitude }

    if (!isLoaded) return <div>Loading Map...</div>

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={globalViewport.zoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
                options={{
                    fullscreenControl: false,
                    gestureHandling: 'greedy',
                    clickableIcons: false,
                }}
            >
                {stores?.map((store) => (
                <Marker key={'MapStore' + store.location.id} position={{ lat: store.lat, lng: store.lng }}>
                    <MapStore
                        store={store}
                    />
                </Marker>
                ))}
        </GoogleMap>
    )
}
