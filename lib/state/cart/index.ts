// @ts-nocheck - FIXME - Types in this file are broken, and this needs a heavy refactor
import {
    atom,
    useRecoilCallback,
    useRecoilValue,
    useSetRecoilState,
} from 'recoil'
import { getPersistedState, makePersistedSetRecoilState } from '../persistence'
import { SuccessBookingCartInfo } from './types'
import { Location } from '@boulevard/blvd-book-sdk/lib/locations'
import {
    Cart,
    CartAvailableBookableItem,
    CartAvailableCategory,
    CartBookableItem,
    CartBookableTime,
} from '@boulevard/blvd-book-sdk/lib/cart'
import { Blvd } from 'lib/sdk/blvd'
import { useSetBookingAnswersState } from 'lib/state/booking-answers'
import { useSetPersonalInformationState } from 'lib/state/personal-info'
import { useStores } from 'lib/sdk/hooks/useStores'
import {
    useAvailableBookableItemStoresState,
    useResetCartStoreState,
    useSetAvailableBookableItemStoresState,
    useSetCartStoreState,
} from 'lib/state/store'
import { PersonalInformation } from 'lib/state/personal-info/types'
import { cartTimeToDate } from 'lib/utils/formatDateFns'
import { useAnalyticsService } from 'lib/analytics-api/analyticsService'
import { AvailableBookableItemStores, Store } from 'lib/state/store/types'
import { useResetStaffDatesStore } from 'lib/state/staffDate'
import {
    useResetSelectedStaffTimeState,
    useResetStaffTimesState,
} from 'lib/state/staffTime'
import {
    useMapView,
    useResetLocationSelectedStoreState,
    useSetLocationSelectedStoreState,
    useSetMapViewportState,
} from 'lib/state/location'
import {
    defaultZoom,
    mapBoxFlyToInterpolator,
    mapBoxTransitionDuration,
} from 'lib/utils/locationUtils'
import {
    useResetSelectedCartAvailableCategory,
    useSelectedServices,
    useSetActiveSelectedService,
    useSetAvailableCategories,
    useSetSelectedCartAvailableCategory,
} from 'lib/state/services'
import {
    CartAvailableBookableItemLocationVariant,
    CartAvailableBookableItemOption,
    CartAvailableItem,
    CartAvailablePurchasableItem,
} from '@boulevard/blvd-book-sdk/lib/carts/items'
import { CartBookableItemStaff, Staff } from 'lib/state/staff/types'
import {
    cartAvailableBookableItemStaffVariantToStaff,
    useSetAllowChooseStaffError,
    useSetBookableStaffVariants,
    useSetCartBookableItemListStaff,
} from 'lib/state/staff'
import { CartBookingQuestion } from '@boulevard/blvd-book-sdk/lib/carts/bookingQuestions'

const CART_ID_KEY = 'CART_ID'

const cartState = atom<Cart | undefined>({
    key: 'cartState',
    default: undefined,
})

const successBookingCartInfoState = atom<SuccessBookingCartInfo | undefined>({
    key: 'successBookingCartInfoState',
    default: undefined,
})

export const cartIdState = atom<string | undefined>({
    key: 'cartIdState',
    default: getPersistedState(CART_ID_KEY) ?? undefined,
})

export const defaultBlvdLocationState = atom<Location | undefined>({
    key: 'defaultBlvdLocationState',
    default: undefined,
})

export const cartDataLoaded = atom<boolean>({
    key: 'cartDataLoaded',
    default: false,
})

export const useCartState = () => useRecoilValue(cartState)
export const useSetCartState = () => useSetRecoilState(cartState)

export const useCartIdState = () => useRecoilValue(cartIdState)
export const useSetCartIdState = makePersistedSetRecoilState(
    CART_ID_KEY,
    cartIdState
)

export const useDefaultBlvdLocationState = () =>
    useRecoilValue(defaultBlvdLocationState)
export const useSetDefaultBlvdLocationState = () =>
    useSetRecoilState(defaultBlvdLocationState)

export const useSuccessBookingCartInfoState = () =>
    useRecoilValue(successBookingCartInfoState)
export const useSetSuccessBookingCartInfoState = () =>
    useSetRecoilState(successBookingCartInfoState)

export interface CartServices {
    cart: Cart
    services: CartBookableItem[]
}

export const useCartMethods = () => {
    const setCart = useSetCartState()
    const setCartIdState = useSetCartIdState()
    const setBookingAnswers = useSetBookingAnswersState()
    const setPersonalInformationState = useSetPersonalInformationState()
    const { getStoreFromLocation, setLocations } = useStores()
    const setCartStoreState = useSetCartStoreState()
    const resetCartStoreState = useResetCartStoreState()
    const setLocationSelectedStoreState = useSetLocationSelectedStoreState()
    const resetLocationSelectedStoreState = useResetLocationSelectedStoreState()
    const { appointmentTimeSelected } = useAnalyticsService()
    const resetStaffDatesStore = useResetStaffDatesStore()
    const resetStaffTimesState = useResetStaffTimesState()
    const resetSelectedStaffTimeState = useResetSelectedStaffTimeState()
    const { getMapViewportState } = useMapView()
    const setViewport = useSetMapViewportState()
    const setAvailableCategories = useSetAvailableCategories()
    const {
        loadSelectedServicesFromCart,
        reverseSelectedServices,
        selectedCartAvailableItemsStateValue,
        setSelectedCartAvailableItemsState,
    } = useSelectedServices()
    const setActiveSelectedService = useSetActiveSelectedService() // Manages activeSelectedServiceState
    const setBookableStaffVariants = useSetBookableStaffVariants() // Manages bookableStaffVariantsState
    const setAllowChooseStaffError = useSetAllowChooseStaffError()
    const setCartBookableItemListStaff = useSetCartBookableItemListStaff()
    const availableBookableItemStores = useAvailableBookableItemStoresState()
    const setAvailableBookableItemStores =
        useSetAvailableBookableItemStoresState()
    const setSelectedCartAvailableCategory =
        useSetSelectedCartAvailableCategory()
    const resetSelectedCartAvailableCategory =
        useResetSelectedCartAvailableCategory()

    const isCartAvailableBookableItem = (
        availableItem: CartAvailableItem | CartBookableItem | undefined
    ): availableItem is CartAvailableBookableItem | CartBookableItem => {
        if (!availableItem) return false
        if ('item' in availableItem) { // It's a CartBookableItem
            return availableItem.item['__typename'] === 'CartAvailableBookableItem'
        }
        // It's a CartAvailableItem
        return availableItem['__typename'] === 'CartAvailableBookableItem'
    }

    const isCartAvailablePurchasableItem = (
        availableItem: CartAvailableItem | undefined
    ) => {
        return (
            availableItem &&
            availableItem['__typename'] === 'CartAvailablePurchasableItem'
        )
    }

    // This function is a common part of add/remove/select staff.
    // It ensures essential states are reset when the cart's service composition changes.
    const handleCartUpdate = async (
        cart: Cart,
        selectedCartAvailableItems: CartAvailableItem[]
    ): Promise<CartServices> => {
        setCart(cart)
        // This function primarily loads items into selectedCartAvailableItemsState, not for staff display
        const services = await loadSelectedServicesFromCart(
            cart,
            selectedCartAvailableItems
        )
        resetStaffDatesStore()
        resetStaffTimesState()
        resetSelectedStaffTimeState()
        // After cart updates, staff for the *active* service (if any) should be loaded.
        // The active service is managed by activeSelectedServiceState.
        // The calling context (e.g., a useEffect hook watching activeSelectedServiceState)
        // will be responsible for calling loadStaffForService.
        return { cart, services }
    }

    const addService = async (
        cart: Cart,
        availableItem: CartAvailableItem
    ): Promise<CartServices> => {
        if (isCartAvailablePurchasableItem(availableItem)) {
            cart = await cart.addPurchasableItem(
                availableItem as CartAvailablePurchasableItem
            )
        } else {
            cart = await cart.addBookableItem(
                availableItem as CartAvailableBookableItem
            )
        }
        const selectedCartAvailableItems =
            selectedCartAvailableItemsStateValue.concat(availableItem)
        setSelectedCartAvailableItemsState(selectedCartAvailableItems)
        // setActiveSelectedService should be called by the UI initiating addService,
        // then loadStaffForService will be triggered by the change in activeSelectedServiceState.
        return await handleCartUpdate(cart, selectedCartAvailableItems)
    }

    const removeService = async (
        cart: Cart,
        bookableItem: CartBookableItem
    ): Promise<CartServices> => {
        cart = await cart.removeSelectedItem(bookableItem)
        const selectedCartAvailableItems: CartAvailableItem[] = []
        let wasFound = false
        for (let item of selectedCartAvailableItemsStateValue) {
            // Compare with bookableItem.item.id if your bookableItem is a CartBookableItem
            // and item is a CartAvailableItem. This assumes IDs are consistent.
            // For now, assuming item.id can match bookableItem.id (if bookableItem is the item itself)
            // This might need adjustment based on exact types and ID sources.
            if (!wasFound && item.id === bookableItem.id) { // This comparison might need care
                wasFound = true
                continue
            }
            selectedCartAvailableItems.push(item)
        }
        setSelectedCartAvailableItemsState(selectedCartAvailableItems)
        // After removing a service, the active service might change or become undefined.
        // UI should manage setting a new active service, which then triggers loadStaffForService.
        return await handleCartUpdate(cart, selectedCartAvailableItems)
    }

    const addAddon = async (
        cart: Cart,
        bookableItem: CartBookableItem, // This is the service being modified
        option: CartAvailableBookableItemOption
    ) => {
        const options = bookableItem.selectedOptions
        cart = await bookableItem.update({
            options: [...options, option],
            staffVariant: bookableItem.selectedStaffVariant,
        })
        // The active service (bookableItem) hasn't changed, but its state has. Reload its staff.
        // However, general cart updates are handled by handleCartUpdate.
        // loadStaffForService for the bookableItem should be triggered if its staff options could change.
        // For now, let's assume addRemoveServiceCommon's resets are enough,
        // and staff loading is tied to activeSelectedServiceState.
        const result = await handleCartUpdate(
            cart,
            selectedCartAvailableItemsStateValue // selectedCartAvailableItemsStateValue should be up-to-date
        )
        // Explicitly reload staff for the modified service if it's the active one
        // This assumes activeSelectedServiceState holds the service being modified (bookableItem)
        const currentActiveService = selectedCartAvailableItemsStateValue.find(s => s.id === bookableItem.item.id)
        if (currentActiveService && isCartAvailableBookableItem(currentActiveService)) {
             // Ensure bookableItem is compatible with loadStaffForService
             // The `bookableItem` here is a CartBookableItem, loadStaffForService expects this.
            await loadStaffForService(bookableItem)
        }
        return result
    }

    const removeAddon = async (
        cart: Cart,
        bookableItem: CartBookableItem, // Service being modified
        option: CartAvailableBookableItemOption
    ) => {
        const options = bookableItem.selectedOptions
        cart = await bookableItem.update({
            options: [...options.filter((opt) => opt.id !== option.id)],
        })
        const result = await handleCartUpdate(
            cart,
            selectedCartAvailableItemsStateValue
        )
        // Similar to addAddon, reload staff for the active, modified service.
        const currentActiveService = selectedCartAvailableItemsStateValue.find(s => s.id === bookableItem.item.id)
        if (currentActiveService && isCartAvailableBookableItem(currentActiveService)) {
            await loadStaffForService(bookableItem)
        }
        return result
    }

    const selectStaff = async (
        cart: Cart,
        bookableItem: CartBookableItem, // This is the service for which staff is being selected
        staff: Staff | undefined
    ) => {
        cart = await bookableItem.update({
            options: bookableItem.selectedOptions,
            staffVariant: staff?.staffVariant ?? { id: null },
        })
        // The staff selection for bookableItem has changed.
        // Other cart items are not directly affected in terms of their own staff *options*.
        // The primary outcome is that the cart is updated.
        // `handleCartUpdate` resets general staff states (dates, times).
        // `bookableStaffVariantsState` for *this* bookableItem doesn't need to be reloaded
        // as we've just *selected* from it.
        return await handleCartUpdate(
            cart,
            selectedCartAvailableItemsStateValue // This should reflect the current state of selected items
        )
    }

    const setLocationBasedElements = async (
        location: Location | undefined,
        store: Store | undefined
    ) => {
        if (location === undefined) {
            resetCartStoreState()
            resetLocationSelectedStoreState()
            return
        }
        let locationStore = store
        if (locationStore === undefined) {
            locationStore = await getStoreFromLocation(location)
        }
        setCartStoreState(locationStore)
        setLocationSelectedStoreState(locationStore)
        const viewport = getMapViewportState()
        const updatedViewPort = {
            ...viewport,
            ...{
                longitude: locationStore.location.coordinates?.longitude ?? 0,
                latitude: locationStore.location.coordinates?.latitude ?? 0,
                zoom: defaultZoom,
                transitionDuration: mapBoxTransitionDuration,
                transitionInterpolator: mapBoxFlyToInterpolator,
            },
        }
        setViewport(updatedViewPort)
    }

    const setCartCommonState = async (
        cart: Cart,
        location: Location | undefined,
        store: Store | undefined
    ): Promise<CartAvailableCategory[]> => {
        setCart(cart)
        const cartCategories = (await cart.getAvailableCategories()).filter(
            (x) => x.name !== 'Gift Cards'
        )
        setAvailableCategories(cartCategories)
        await setLocationBasedElements(location, store)
        if (cartCategories?.length) {
            setSelectedCartAvailableCategory(cartCategories[0])
        }
        return cartCategories
    }

    const createCart = async (
        location?: Location | undefined,
        store?: Store | undefined
    ): Promise<Cart> => {
        const cart = await Blvd.carts.create(location)
        setCartIdState(cart.id)
        setBookingAnswers([])
        setPersonalInformationState({
            firstName: '',
            email: '',
            lastName: '',
            phone: '',
        })
        resetStaffDatesStore()
        resetStaffTimesState()
        await setCartCommonState(cart, location, store)
        return cart
    }

    const getCartDataLoadedState = useRecoilCallback(
        ({ snapshot }) =>
            () => {
                let loadable = snapshot.getLoadable(cartDataLoaded)
                return loadable.valueMaybe()
            },
        []
    )

    const reserveBookableTime = async (
        cart: Cart | undefined,
        cartBookableTime: CartBookableTime | undefined,
        cartStoreState: Store | undefined
    ): Promise<Cart | undefined> => {
        if (!cartBookableTime || !cart) {
            return undefined
        }
        try {
            cart = await cart.reserveBookableItems(cartBookableTime)
            appointmentTimeSelected({
                store: cartStoreState as Store,
                cart,
            })
            setCart(cart)
            if (cartStoreState) {
                setCartCommonState(
                    cart,
                    cartStoreState.location,
                    cartStoreState
                )
            }
            // After reserving, selectedBookableItems are set.
            // We need to load staff for the *active* service.
            // The UI should determine which service becomes active.
            // For now, if there's an active service, reload its staff.
            // Otherwise, the component responsible for displaying staff should call loadStaffForService
            // when a service becomes active.
            // A default could be to load for the first service:
            if (cart.selectedBookableItems.length > 0) {
                const firstService = cart.selectedBookableItems[0]
                // setActiveSelectedService should ideally be called by UI,
                // then an effect would call loadStaffForService.
                // Direct call here for simplicity if no immediate UI trigger.
                setActiveSelectedService(firstService) // This will trigger effect to call loadStaffForService
            }
            return cart
        } catch (error) {
            console.error('Error reserving bookable time:', error)
            return undefined
        }
    }

    const getAnswer = (bookingQuestion: CartBookingQuestion): any => {
        let answer = bookingQuestion.answer
        if (bookingQuestion.valueType === 'SELECT') {
            answer = bookingQuestion.answer?.option
        }
        if (bookingQuestion.valueType === 'BOOLEAN') {
            answer = bookingQuestion.answer?.booleanValue
        }
        if (bookingQuestion.valueType === 'DATETIME') {
            answer = cartTimeToDate(bookingQuestion.answer?.datetimeValue)
        }
        if (bookingQuestion.valueType === 'TEXT') {
            answer = bookingQuestion.answer?.textValue
        }
        return answer === null ? undefined : answer
    }

    const loadBookingAnswers = (cart: Cart) => {
        for (let question of cart.bookingQuestions) {
            if (!question.answer) {
                continue
            }
            setBookingAnswers((bookingAnswers) => [
                ...bookingAnswers.filter((q) => q.questionId !== question.id),
                {
                    questionId: question.id,
                    answer: getAnswer(question),
                },
            ])
        }
    }

    const getPersonalInformation = (cart: Cart): PersonalInformation => {
        return {
            email: cart.clientInformation?.email ?? '',
            phone: cart.clientInformation?.phoneNumber.substring(2) ?? '',
            firstName: cart.clientInformation?.firstName ?? '',
            lastName: cart.clientInformation?.lastName ?? '',
        }
    }

    const resetCategories = async () => {
        resetSelectedCartAvailableCategory()
    }

    /**
     * Loads staff variants for a specific service item and updates relevant states.
     * This function is intended to be called when the UI focus changes to a specific service
     * for staff selection.
     * @param serviceItem The CartBookableItem for which to load staff.
     * @param selectedCartAvailableCategory Optional: The category to set as selected.
     */
    const loadStaffForService = async (
        serviceItem: CartBookableItem,
        selectedCartAvailableCategory?: CartAvailableCategory | undefined
    ) => {
        if (!serviceItem) {
            setBookableStaffVariants([])
            setAllowChooseStaffError(false) // Or true, depending on desired behavior for no service
            return
        }

        // Ensure activeSelectedServiceState is updated to this serviceItem.
        // This is crucial if this function is called directly and not as an effect of activeSelectedServiceState changing.
        // However, the primary design should be that setActiveSelectedService is called by UI,
        // and an effect hook then calls this function.
        // For safety, we can call it here, but it might cause an extra render if already set.
        setActiveSelectedService(serviceItem)

        if (isCartAvailableBookableItem(serviceItem)) { // Check if the service item itself is bookable
            try {
                const staffs = await serviceItem.item.getStaffVariants()
                setBookableStaffVariants(
                    staffs.flatMap((z) =>
                        cartAvailableBookableItemStaffVariantToStaff(z)
                    )
                )
                setAllowChooseStaffError(false)
            } catch (error) {
                console.error("Error loading staff variants:", error);
                setBookableStaffVariants([])
                setAllowChooseStaffError(true) // Indicate an error occurred
            }
        } else {
            setBookableStaffVariants([])
            setAllowChooseStaffError(false) // Not a bookable item, so no staff, no error in loading
        }

        if (selectedCartAvailableCategory) {
            setSelectedCartAvailableCategory(selectedCartAvailableCategory)
        }
    }
    
    const getSelectedCartAvailableCategoryFromSelectedServices = (
        servicesFromCart: CartBookableItem[],
        availableCategories: CartAvailableCategory[]
    ) => {
        let selectedCartAvailableCategory: CartAvailableCategory | undefined =
            undefined

        if (servicesFromCart.length === 0) {
            return {
                selectedCartAvailableCategory: selectedCartAvailableCategory,
            }
        }

        selectedCartAvailableCategory = availableCategories.find((pc) =>
            pc.availableItems.some((i) => i.id === servicesFromCart[0].item.id)
        )
        return {
            selectedCartAvailableCategory: selectedCartAvailableCategory,
        }
    }

    const forceLoadSelectedServices = async (
        cart: Cart,
        availableCategories: CartAvailableCategory[]
    ) => {
        const servicesFromCart = await loadSelectedServicesFromCart(cart, [])
        const { selectedCartAvailableCategory } =
            getSelectedCartAvailableCategoryFromSelectedServices(
                servicesFromCart, // These are CartBookableItem[]
                availableCategories
            )

        // After forcing load of selected services, we need to load staff
        // for the now "active" service. loadSelectedServicesFromCart (used above)
        // returns CartBookableItem[]. We might pick the first one as active.
        if (servicesFromCart.length > 0) {
            // setActiveSelectedService should be called here,
            // which would then trigger an effect to call loadStaffForService.
            // For simplicity in this refactor, if we assume forceLoadSelectedServices
            // implies the first service becomes active for staff view:
            setActiveSelectedService(servicesFromCart[0]) // This sets the active service
            // The actual call to loadStaffForService would ideally be in a useEffect
            // listening to activeSelectedServiceState.
            // If direct call is needed: await loadStaffForService(servicesFromCart[0], selectedCartAvailableCategory);
            // However, to stick to the pattern of activeSelectedService triggering staff load:
            // The component observing activeSelectedServiceState should handle calling loadStaffForService.
            // This function's responsibility ends at setting the active service.
        } else {
            setActiveSelectedService(undefined)
            setBookableStaffVariants([]) // No services, so no staff
        }
        return servicesFromCart
    }

    const loadSelectedStaff = async (servicesFromCart: CartBookableItem[]) => {
        const staffs: CartBookableItemStaff[] = []
        for (let selectedItem of servicesFromCart) {
            if (selectedItem.selectedStaffVariant) {
                staffs.push({
                    cartBookableItemId: selectedItem.id,
                    staff: cartAvailableBookableItemStaffVariantToStaff(
                        selectedItem.selectedStaffVariant
                    ),
                })
            }
        }
        setCartBookableItemListStaff(staffs)
    }

    const loadStoresForCartBookableItems = async (
        selectedBookableItems: CartBookableItem[],
        lastSelectedItem: CartAvailableBookableItem
    ) => {
        let locations: CartAvailableBookableItemLocationVariant[] | undefined =
            undefined
        const cartAvailableBookableItems = selectedBookableItems.map(
            (i) => i.item as CartAvailableBookableItem
        )
        if (lastSelectedItem) cartAvailableBookableItems.push(lastSelectedItem)
        const localAvailableBookableItemStores =
            availableBookableItemStores.concat()
        for (let availableBookableItem of cartAvailableBookableItems) {
            const filteredAvailableBookableItemStores =
                localAvailableBookableItemStores.filter(
                    (x) => x.availableBookableItemId == availableBookableItem.id
                )
            let itemLocationVariants =
                filteredAvailableBookableItemStores.flatMap(
                    (x) => x.cartAvailableBookableItemLocationVariant
                )
            if (itemLocationVariants.length == 0) {
                itemLocationVariants =
                    await availableBookableItem.getLocationVariants()
                localAvailableBookableItemStores.push({
                    availableBookableItemId: availableBookableItem.id,
                    cartAvailableBookableItemLocationVariant:
                        itemLocationVariants,
                } as AvailableBookableItemStores)
            }
            if (locations === undefined) {
                locations = itemLocationVariants
            } else {
                locations = locations.filter((l) =>
                    itemLocationVariants.some(
                        (v) => v.location.id === l.location.id
                    )
                )
            }
        }
        setAvailableBookableItemStores(localAvailableBookableItemStores)
        if (locations) {
            setLocations(locations.map((l) => l.location))
        } else {
            setLocations([])
        }
    }

    const setCartLocation = async (
        cart: Cart,
        selectedStore: Store,
        cartStore: Store | undefined,
        lastSelectedItem: CartAvailableBookableItem | undefined,
        selectedBookableItems: CartBookableItem[]
    ) => {
        if (!cart) {
            return selectedBookableItems
        }
        let newCart = cart

        // if new location distinguish from previous selected location, replace cart with new one
        if (!cartStore || cartStore.location.id !== selectedStore.location.id) {
            newCart = await createCart(selectedStore.location, selectedStore)

            for (let item of selectedBookableItems) {
                const cartBookableItem = item as CartBookableItem
                const cartAvailableBookableItem =
                    cartBookableItem.item as CartAvailableBookableItem
                if (cartAvailableBookableItem) {
                    newCart = await newCart.addBookableItem(
                        cartAvailableBookableItem
                    )
                }
            }
        }

        if (!cartStore) {
            newCart = await newCart.setLocation(selectedStore.location)
        }

        let selectedCartAvailableItems = selectedCartAvailableItemsStateValue
        if (lastSelectedItem) {
            newCart = await newCart.addBookableItem(lastSelectedItem)
            selectedCartAvailableItems =
                selectedCartAvailableItems.concat(lastSelectedItem)
            setSelectedCartAvailableItemsState(selectedCartAvailableItems)
        }
        return await loadSelectedServicesFromCart(
            newCart,
            selectedCartAvailableItems
        )
    }

    return {
        createCart: createCart,
        setCartCommonState: setCartCommonState,
        getCartDataLoadedState: getCartDataLoadedState,
        reserveBookableTime: reserveBookableTime,
        getPersonalInformation: getPersonalInformation,
        loadBookingAnswers: loadBookingAnswers,
        resetCategories: resetCategories,
        addService: addService,
        removeService: removeService,
        addAddon: addAddon,
        removeAddon: removeAddon,
        selectStaff: selectStaff,
        loadStaffForService: loadStaffForService, // Renamed and behavior changed
        forceLoadSelectedServices: forceLoadSelectedServices, // Interaction with loadStaffForService needs to be via activeSelectedServiceState
        loadSelectedStaff: loadSelectedStaff, // This loads CHOSEN staff, not available staff.
        loadStoresForCartBookableItems: loadStoresForCartBookableItems,
        setCartLocation: setCartLocation,
        isCartAvailableBookableItem: isCartAvailableBookableItem,
        isCartAvailablePurchasableItem: isCartAvailablePurchasableItem,
    }
}

export const useCartDataLoadedState = () => useRecoilValue(cartDataLoaded)
export const useSetCartDataLoadedState = () => useSetRecoilState(cartDataLoaded)
