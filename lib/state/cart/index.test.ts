import { runHook } from '@testing-library/react-hooks';
import { useCartMethods, cartState, cartIdState, defaultBlvdLocationState, successBookingCartInfoState, cartDataLoaded } from './index';
import { useSetBookingAnswersState } from 'lib/state/booking-answers';
import { useSetPersonalInformationState } from 'lib/state/personal-info';
import { useStores } from 'lib/sdk/hooks/useStores';
import {
    useAvailableBookableItemStoresState,
    useResetCartStoreState,
    useSetAvailableBookableItemStoresState,
    useSetCartStoreState,
} from 'lib/state/store';
import { useAnalyticsService } from 'lib/analytics-api/analyticsService';
import { useResetStaffDatesStore } from 'lib/state/staffDate';
import {
    useResetSelectedStaffTimeState,
    useResetStaffTimesState,
} from 'lib/state/staffTime';
import {
    useMapView,
    useResetLocationSelectedStoreState,
    useSetLocationSelectedStoreState,
    useSetMapViewportState,
} from 'lib/state/location';
import {
    useSelectedServices,
    useSetActiveSelectedService,
    useSetAvailableCategories,
    useSetSelectedCartAvailableCategory,
    activeSelectedServiceState, // Assuming this is the atom for active service
} from 'lib/state/services';
import {
    useSetAllowChooseStaffError,
    useSetBookableStaffVariants,
    bookableStaffVariantsState, // Assuming this is the atom for staff variants
    cartBookableItemListStaffState,
} from 'lib/state/staff';
import { Blvd } from 'lib/sdk/blvd';
import { Cart, CartBookableItem, CartAvailableBookableItem, CartAvailableCategory, CartAvailableItem } from '@boulevard/blvd-book-sdk/lib/cart';
import { Location } from '@boulevard/blvd-book-sdk/lib/locations';

// Mock Recoil hooks and atoms
jest.mock('recoil', () => ({
    ...jest.requireActual('recoil'),
    atom: jest.fn((config) => jest.requireActual('recoil').atom(config)), // Pass through to actual atom creation
    useRecoilValue: jest.fn(),
    useSetRecoilState: jest.fn(),
    useRecoilCallback: jest.fn(),
}));

// Mock other hooks
jest.mock('lib/state/booking-answers');
jest.mock('lib/state/personal-info');
jest.mock('lib/sdk/hooks/useStores');
jest.mock('lib/state/store');
jest.mock('lib/analytics-api/analyticsService');
jest.mock('lib/state/staffDate');
jest.mock('lib/state/staffTime');
jest.mock('lib/state/location');
jest.mock('lib/state/services');
jest.mock('lib/state/staff');
jest.mock('lib/sdk/blvd');


// --- MOCK DATA & TYPES ---
interface MockStaff {
    id: string;
    name: string;
    staffVariant?: any; // Simplified
}

interface MockCartAvailableBookableItem extends CartAvailableBookableItem {
    getStaffVariants: jest.Mock<Promise<any[]>, []>;
    getLocationVariants: jest.Mock<Promise<any[]>, []>;
}

interface MockCartBookableItem extends CartBookableItem {
    item: MockCartAvailableBookableItem;
    update: jest.Mock<Promise<MockCart>, [{ options?: any[], staffVariant?: any }]>;
}

interface MockCart extends Cart {
    addBookableItem: jest.Mock<Promise<MockCart>, [CartAvailableBookableItem]>;
    removeSelectedItem: jest.Mock<Promise<MockCart>, [CartBookableItem]>;
    getAvailableCategories: jest.Mock<Promise<CartAvailableCategory[]>, []>;
    setLocation: jest.Mock<Promise<MockCart>, [Location]>;
    reserveBookableItems: jest.Mock<Promise<MockCart>, [any]>;
    selectedBookableItems: MockCartBookableItem[];
}

const mockStaff1: MockStaff = { id: 'staff-1', name: 'Staff One', staffVariant: {id: 'sv1'} };
const mockStaff2: MockStaff = { id: 'staff-2', name: 'Staff Two', staffVariant: {id: 'sv2'} };
const mockStaff3: MockStaff = { id: 'staff-3', name: 'Staff Three', staffVariant: {id: 'sv3'} };

const createMockAvailableItem = (id: string, name: string, staff: MockStaff[]): MockCartAvailableBookableItem => ({
    id,
    name,
    description: `${name} description`,
    duration: 30,
    getStaffVariants: jest.fn().mockResolvedValue(staff.map(s => ({ ...s.staffVariant, staff: s }))), // SDK like structure
    getLocationVariants: jest.fn().mockResolvedValue([]),
    price: { amount: 5000, currency: 'USD' },
    itemOptions: [],
    type: 'service',
    __typename: 'CartAvailableBookableItem',
} as unknown as MockCartAvailableBookableItem);

const createMockBookableItem = (availableItem: MockCartAvailableBookableItem): MockCartBookableItem => ({
    id: `bookable-${availableItem.id}`,
    item: availableItem,
    selectedOptions: [],
    selectedStaffVariant: null,
    update: jest.fn().mockImplementation(async function(this: MockCartBookableItem, {staffVariant}) {
        this.selectedStaffVariant = staffVariant;
        return mockCartInstance; // Return the cart instance
    }),
    __typename: 'CartBookableItem',
} as unknown as MockCartBookableItem);

let mockCartInstance: MockCart;

// --- RECOIL HOOK MOCKS IMPLEMENTATION ---
const mockRecoilStates: Record<string, any> = {};
const mockSetStates: Record<string, jest.Mock> = {};

const initializeRecoilMock = () => {
    const actualRecoil = jest.requireActual('recoil');
    (actualRecoil.atom as jest.Mock).mockImplementation((config) => {
        const newAtom = actualRecoil.defaultStateRegistry.get(config.key) || actualRecoil.atom(config);
        mockRecoilStates[config.key] = newAtom; // Store atom for direct manipulation if needed
        return newAtom;
    });

    (jest.requireMock('recoil').useRecoilValue as jest.Mock).mockImplementation((atom) => {
        const atomActual = typeof atom === 'string' ? mockRecoilStates[atom] : atom;
        if (!atomActual || !mockRecoilStates[atomActual.key]) {
             // Fallback to default if not explicitly set in tests
            const foundAtom = Object.values(mockRecoilStates).find(a => a.key === atomActual?.key);
            return foundAtom ? actualRecoil.getRecoilValue(foundAtom) : undefined;
        }
        return actualRecoil.getRecoilValue(mockRecoilStates[atomActual.key]);
    });

    (jest.requireMock('recoil').useSetRecoilState as jest.Mock).mockImplementation((atom) => {
        const atomActual = typeof atom === 'string' ? mockRecoilStates[atom] : atom;
        if (!mockSetStates[atomActual.key]) {
            mockSetStates[atomActual.key] = jest.fn((value) => {
                const currentAtom = mockRecoilStates[atomActual.key];
                if (currentAtom) {
                    // This is a simplified update. Recoil's actual update is more complex.
                    // For testing, we might need a way to trigger effects if components were involved.
                    // Here, we're focusing on if the setter is called with the right value.
                    const recoilValue = require('recoil').RecoilRoot.prototype.getStore_INTERNAL().getState(currentAtom);
                    recoilValue.value = typeof value === 'function' ? value(recoilValue.value) : value;

                }
            });
        }
        return mockSetStates[atomActual.key];
    });
};


// --- MOCK OTHER HOOKS SETUP ---
const mockSetActiveSelectedService = jest.fn();
const mockSetBookableStaffVariants = jest.fn();
const mockSetAllowChooseStaffError = jest.fn();
const mockLoadSelectedServicesFromCart = jest.fn().mockImplementation(async (cart, items) => {
    // This mock needs to return the CartBookableItem instances based on selectedCartAvailableItems
    return cart.selectedBookableItems;
});
const mockReverseSelectedServices = jest.fn(items => [...items].reverse());


describe('useCartMethods - Multi-Appointment Staff Selection', () => {
    let cartMethods: ReturnType<typeof useCartMethods>;

    beforeEach(() => {
        jest.clearAllMocks();
        initializeRecoilMock(); // Initialize Recoil mocks for each test

        // Setup default mock implementations for other hooks
        (useSetBookingAnswersState as jest.Mock).mockReturnValue(jest.fn());
        (useSetPersonalInformationState as jest.Mock).mockReturnValue(jest.fn());
        (useStores as jest.Mock).mockReturnValue({
            getStoreFromLocation: jest.fn(),
            setLocations: jest.fn(),
        });
        (useResetCartStoreState as jest.Mock).mockReturnValue(jest.fn());
        (useSetAvailableBookableItemStoresState as jest.Mock).mockReturnValue(jest.fn());
        (useSetCartStoreState as jest.Mock).mockReturnValue(jest.fn());
        (useAvailableBookableItemStoresState as jest.Mock).mockReturnValue([]);
        (useAnalyticsService as jest.Mock).mockReturnValue({
            appointmentTimeSelected: jest.fn(),
        });
        (useResetStaffDatesStore as jest.Mock).mockReturnValue(jest.fn());
        (useResetSelectedStaffTimeState as jest.Mock).mockReturnValue(jest.fn());
        (useResetStaffTimesState as jest.Mock).mockReturnValue(jest.fn());
        (useMapView as jest.Mock).mockReturnValue({ getMapViewportState: jest.fn() });
        (useResetLocationSelectedStoreState as jest.Mock).mockReturnValue(jest.fn());
        (useSetLocationSelectedStoreState as jest.Mock).mockReturnValue(jest.fn());
        (useSetMapViewportState as jest.Mock).mockReturnValue(jest.fn());

        (useSelectedServices as jest.Mock).mockReturnValue({
            loadSelectedServicesFromCart: mockLoadSelectedServicesFromCart,
            reverseSelectedServices: mockReverseSelectedServices,
            selectedCartAvailableItemsStateValue: [], // Adjust as needed per test
            setSelectedCartAvailableItemsState: jest.fn(),
        });
        (useSetActiveSelectedService as jest.Mock).mockReturnValue(mockSetActiveSelectedService);
        (useSetAvailableCategories as jest.Mock).mockReturnValue(jest.fn());
        (useSetSelectedCartAvailableCategory as jest.Mock).mockReturnValue(jest.fn());

        (useSetAllowChooseStaffError as jest.Mock).mockReturnValue(mockSetAllowChooseStaffError);
        (useSetBookableStaffVariants as jest.Mock).mockReturnValue(mockSetBookableStaffVariants);
        (useSetCartBookableItemListStaff as jest.Mock) // from lib/state/staff
            .mockReturnValue(jest.fn());


        // Mock Blvd SDK
        (Blvd.carts.create as jest.Mock).mockImplementation(async (location?: Location) => {
            mockCartInstance = {
                id: 'cart-1',
                selectedBookableItems: [],
                clientInformation: null,
                bookingQuestions: [],
                paymentSummary: null,
                addBookableItem: jest.fn().mockImplementation(async function(this: MockCart, itemToAdd) {
                    const bookable = createMockBookableItem(itemToAdd as MockCartAvailableBookableItem);
                    this.selectedBookableItems.push(bookable);
                    return this; // Return cart for chaining
                }),
                removeSelectedItem: jest.fn().mockImplementation(async function(this: MockCart, itemToRemove) {
                    this.selectedBookableItems = this.selectedBookableItems.filter(bi => bi.id !== itemToRemove.id);
                    return this;
                }),
                getAvailableCategories: jest.fn().mockResolvedValue([]),
                setLocation: jest.fn().mockResolvedValue(mockCartInstance),
                reserveBookableItems: jest.fn().mockResolvedValue(mockCartInstance),
                update: jest.fn().mockResolvedValue(mockCartInstance), // General cart update
            } as unknown as MockCart;
            if (location) await mockCartInstance.setLocation(location);
            return mockCartInstance;
        });
        
        // Initialize cart methods - this uses the hooks above
        // We need to wrap this in runHook or similar if it causes issues outside a component
        // For now, direct call and ensure hooks return mocks.
         cartMethods = useCartMethods();


        // Mock initial state for atoms that cartMethods might read via useRecoilValue
        // For activeSelectedServiceState and bookableStaffVariantsState, we will mostly be checking if their setters are called.
        // If cartMethods directly READS them via useRecoilValue, we'd need to provide mock values here.
        // For example, if loadStaffForService reads activeSelectedServiceState:
        // (jest.requireMock('recoil').useRecoilValue as jest.Mock).mockImplementation((atom) => {
        //     if (atom.key === 'activeSelectedServiceState') return /* some mock active service */;
        //     if (atom.key === 'bookableStaffVariantsState') return [];
        //     // ... other atoms
        // });
    });

    describe('loadStaffForService', () => {
        it('should load staff for the specified service item and update bookableStaffVariantsState', async () => {
            const availableItem1 = createMockAvailableItem('service-1', 'Service 1', [mockStaff1, mockStaff2]);
            const bookableItem1 = createMockBookableItem(availableItem1);

            await cartMethods.loadStaffForService(bookableItem1);

            expect(mockSetActiveSelectedService).toHaveBeenCalledWith(bookableItem1);
            expect(availableItem1.getStaffVariants).toHaveBeenCalled();
            expect(mockSetBookableStaffVariants).toHaveBeenCalledWith(
                // The actual staff variants are wrapped by cartAvailableBookableItemStaffVariantToStaff
                // So we expect the raw variants from getStaffVariants to be passed to the setter
                // after being transformed by cartAvailableBookableItemStaffVariantToStaff (which is part of lib/state/staff, assumed to work)
                // For this test, we check what was passed to setBookableStaffVariants
                expect.arrayContaining([
                    expect.objectContaining({ id: 'sv1' }),
                    expect.objectContaining({ id: 'sv2' }),
                ])
            );
            expect(mockSetAllowChooseStaffError).toHaveBeenCalledWith(false);
        });

        it('should set bookableStaffVariantsState to empty and allowChooseStaffError if service item has no staff', async () => {
            const availableItemNoStaff = createMockAvailableItem('service-no-staff', 'Service No Staff', []);
            const bookableItemNoStaff = createMockBookableItem(availableItemNoStaff);

            await cartMethods.loadStaffForService(bookableItemNoStaff);
            
            expect(mockSetActiveSelectedService).toHaveBeenCalledWith(bookableItemNoStaff);
            expect(availableItemNoStaff.getStaffVariants).toHaveBeenCalled();
            expect(mockSetBookableStaffVariants).toHaveBeenCalledWith([]);
            expect(mockSetAllowChooseStaffError).toHaveBeenCalledWith(false); // No error in loading, just no staff
        });


        it('should set bookableStaffVariantsState to empty if serviceItem is not a bookable item (e.g. gift card)', async () => {
            const nonBookableItem = { ...createMockBookableItem(createMockAvailableItem('gb-1', 'Gift Card', [])), __typename: 'CartSelectedPurchasableItem' } as any;
            // Ensure isCartAvailableBookableItem correctly identifies it as non-bookable for staff
            (nonBookableItem.item as MockCartAvailableBookableItem).__typename = 'CartAvailablePurchasableItem';


            await cartMethods.loadStaffForService(nonBookableItem);

            expect(mockSetActiveSelectedService).toHaveBeenCalledWith(nonBookableItem);
            expect(mockSetBookableStaffVariants).toHaveBeenCalledWith([]);
            expect(mockSetAllowChooseStaffError).toHaveBeenCalledWith(false);
        });


        it('should handle errors from getStaffVariants and set error state', async () => {
            const availableItemError = createMockAvailableItem('service-error', 'Service Error', []);
            availableItemError.getStaffVariants.mockRejectedValueOnce(new Error('SDK Error'));
            const bookableItemError = createMockBookableItem(availableItemError);

            await cartMethods.loadStaffForService(bookableItemError);

            expect(mockSetActiveSelectedService).toHaveBeenCalledWith(bookableItemError);
            expect(availableItemError.getStaffVariants).toHaveBeenCalled();
            expect(mockSetBookableStaffVariants).toHaveBeenCalledWith([]);
            expect(mockSetAllowChooseStaffError).toHaveBeenCalledWith(true);
        });
    });

    describe('Contextual Staff Loading with Multiple Services', () => {
        it('loads staff for Service A, then for Service B, ensuring state reflects current active service', async () => {
            const availableItem1 = createMockAvailableItem('s1', 'Service 1', [mockStaff1]);
            const bookableItem1 = createMockBookableItem(availableItem1);
            const availableItem2 = createMockAvailableItem('s2', 'Service 2', [mockStaff2, mockStaff3]);
            const bookableItem2 = createMockBookableItem(availableItem2);

            // Simulate cart having both items already (not testing addService here)
            mockCartInstance = { ...mockCartInstance, selectedBookableItems: [bookableItem1, bookableItem2] };
            (useSelectedServices as jest.Mock).mockReturnValue({
                ...jest.requireActual('lib/state/services').useSelectedServices(), // Use actual if not fully mocked
                loadSelectedServicesFromCart: mockLoadSelectedServicesFromCart.mockResolvedValue([bookableItem1, bookableItem2]),
                reverseSelectedServices: jest.fn(items => [...items].reverse()),
                selectedCartAvailableItemsStateValue: [availableItem1, availableItem2], // For add/remove addon tests
                setSelectedCartAvailableItemsState: jest.fn(),
            });


            // Load staff for Service A
            await cartMethods.loadStaffForService(bookableItem1);
            expect(mockSetActiveSelectedService).toHaveBeenCalledWith(bookableItem1);
            expect(mockSetBookableStaffVariants).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({id: 'sv1'})]));
            expect(mockSetBookableStaffVariants).not.toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({id: 'sv2'})]));


            // Load staff for Service B
            await cartMethods.loadStaffForService(bookableItem2);
            expect(mockSetActiveSelectedService).toHaveBeenCalledWith(bookableItem2);
            expect(mockSetBookableStaffVariants).toHaveBeenLastCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({id: 'sv2'}),
                    expect.objectContaining({id: 'sv3'})
                ])
            );
        });
    });
    
    describe('Interaction with Cart Operations', () => {
        let currentCart: MockCart;

        beforeEach(async () => {
             // Create a fresh cart for each test in this block
            currentCart = await Blvd.carts.create();
            (useSelectedServices as jest.Mock).mockImplementation(() => ({
                loadSelectedServicesFromCart: mockLoadSelectedServicesFromCart,
                reverseSelectedServices: mockReverseSelectedServices,
                selectedCartAvailableItemsStateValue: currentCart.selectedBookableItems.map(bi => bi.item),
                setSelectedCartAvailableItemsState: jest.fn(items => {
                     // Update the mock value for selectedCartAvailableItemsStateValue based on what's set
                    (useSelectedServices as jest.Mock).mockImplementation(() => ({
                        loadSelectedServicesFromCart: mockLoadSelectedServicesFromCart,
                        reverseSelectedServices: mockReverseSelectedServices,
                        selectedCartAvailableItemsStateValue: items, // Update here
                        setSelectedCartAvailableItemsState: jest.fn(),
                    }));
                }),
            }));
        });

        it('addService: should allow loading staff for the newly added service if it becomes active', async () => {
            const availableItemNew = createMockAvailableItem('new-s', 'New Service', [mockStaff3]);
            
            // Add service (does not load staff itself)
            await cartMethods.addService(currentCart, availableItemNew);
            const newlyAddedBookableItem = currentCart.selectedBookableItems.find(bi => bi.item.id === 'new-s');
            expect(newlyAddedBookableItem).toBeDefined();

            // Simulate UI making it active, then load staff
            if (newlyAddedBookableItem) {
                // At this point, mockSetActiveSelectedService has NOT been called by addService
                // The UI would call setActiveSelectedService, then an effect would call loadStaffForService
                mockSetActiveSelectedService(newlyAddedBookableItem); // Simulate UI action
                await cartMethods.loadStaffForService(newlyAddedBookableItem); // Simulate effect
    
                expect(availableItemNew.getStaffVariants).toHaveBeenCalled();
                expect(mockSetBookableStaffVariants).toHaveBeenCalledWith(
                    expect.arrayContaining([expect.objectContaining({id: 'sv3'})])
                );
            }
        });

        it('removeService: should allow loading staff for a different service if active one is removed', async () => {
            const itemA = createMockAvailableItem('itemA', 'Item A', [mockStaff1]);
            const itemB = createMockAvailableItem('itemB', 'Item B', [mockStaff2]);

            await cartMethods.addService(currentCart, itemA);
            await cartMethods.addService(currentCart, itemB);
            const bookableA = currentCart.selectedBookableItems.find(bi => bi.item.id === 'itemA')!;
            const bookableB = currentCart.selectedBookableItems.find(bi => bi.item.id === 'itemB')!;

            // Simulate itemA was active, its staff loaded
            mockSetActiveSelectedService(bookableA);
            await cartMethods.loadStaffForService(bookableA);
            expect(mockSetBookableStaffVariants).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({id: 'sv1'})]));

            // Remove itemA
            await cartMethods.removeService(currentCart, bookableA);
            
            // Simulate UI making itemB active, then load its staff
            mockSetActiveSelectedService(bookableB); // Simulate UI making B active
            await cartMethods.loadStaffForService(bookableB); // Simulate effect

            expect(itemB.getStaffVariants).toHaveBeenCalled();
            expect(mockSetBookableStaffVariants).toHaveBeenLastCalledWith(
                expect.arrayContaining([expect.objectContaining({id: 'sv2'})])
            );
        });

        it('addAddon: re-loads staff for the active service if its staff variants change', async () => {
            const availableItem1 = createMockAvailableItem('s1-addon', 'Service 1 Addon', [mockStaff1]);
            await cartMethods.addService(currentCart, availableItem1);
            const bookableItem1 = currentCart.selectedBookableItems[0];

            // Set item1 as active and load its initial staff
            mockSetActiveSelectedService(bookableItem1); // Simulate UI setting it active
            // Provide selectedCartAvailableItemsStateValue for addAddon to find the active service
             (useSelectedServices as jest.Mock).mockReturnValue({
                ...jest.requireMock('lib/state/services').useSelectedServices(),
                loadSelectedServicesFromCart: mockLoadSelectedServicesFromCart.mockResolvedValue([bookableItem1]),
                reverseSelectedServices: mockReverseSelectedServices,
                selectedCartAvailableItemsStateValue: [availableItem1], // CRUCIAL for addAddon's internal check
                setSelectedCartAvailableItemsState: jest.fn(),
            });
            await cartMethods.loadStaffForService(bookableItem1); // Effect loads staff
            expect(mockSetBookableStaffVariants).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({id: 'sv1'})]));

            // Mock that getStaffVariants will return different staff after addon
            availableItem1.getStaffVariants.mockResolvedValueOnce([mockStaff1, mockStaff2]);
            
            const mockOption = { id: 'opt1', name: 'Option 1' } as any;
            await cartMethods.addAddon(currentCart, bookableItem1, mockOption);

            // addAddon itself should have triggered loadStaffForService for bookableItem1
            expect(availableItem1.getStaffVariants).toHaveBeenCalledTimes(2); // Initial load + reload in addAddon
            expect(mockSetBookableStaffVariants).toHaveBeenLastCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({id: 'sv1'}),
                    expect.objectContaining({id: 'sv2'})
                ])
            );
        });

         it('removeAddon: re-loads staff for the active service if its staff variants change', async () => {
            const availableItem1 = createMockAvailableItem('s1-remove-addon', 'Service 1 Remove Addon', [mockStaff1, mockStaff2]);
            await cartMethods.addService(currentCart, availableItem1);
            const bookableItem1 = currentCart.selectedBookableItems[0];
            bookableItem1.selectedOptions = [{ id: 'opt1', name: 'Option 1' } as any]; // Pre-add an option

            mockSetActiveSelectedService(bookableItem1);
            (useSelectedServices as jest.Mock).mockReturnValue({
                ...jest.requireMock('lib/state/services').useSelectedServices(),
                loadSelectedServicesFromCart: mockLoadSelectedServicesFromCart.mockResolvedValue([bookableItem1]),
                reverseSelectedServices: mockReverseSelectedServices,
                selectedCartAvailableItemsStateValue: [availableItem1], 
                setSelectedCartAvailableItemsState: jest.fn(),
            });
            await cartMethods.loadStaffForService(bookableItem1);
            expect(mockSetBookableStaffVariants).toHaveBeenLastCalledWith(expect.arrayContaining([
                expect.objectContaining({id: 'sv1'}),
                expect.objectContaining({id: 'sv2'})
            ]));
            
            availableItem1.getStaffVariants.mockResolvedValueOnce([mockStaff1]); // Staff changes after removing addon

            const mockOptionToRemove = { id: 'opt1', name: 'Option 1' } as any;
            await cartMethods.removeAddon(currentCart, bookableItem1, mockOptionToRemove);

            expect(availableItem1.getStaffVariants).toHaveBeenCalledTimes(2);
            expect(mockSetBookableStaffVariants).toHaveBeenLastCalledWith(
                expect.arrayContaining([expect.objectContaining({id: 'sv1'})])
            );
            expect(mockSetBookableStaffVariants).not.toHaveBeenLastCalledWith(
                expect.arrayContaining([expect.objectContaining({id: 'sv2'})])
            );
        });
    });
});

// Helper to properly mock Recoil atoms and their default values if needed
// This is a simplified version. For more complex scenarios, Recoil's testing utils might be better.
const mockRecoilAtom = <T>(key: string, defaultValue: T) => {
    const atom = jest.requireActual('recoil').atom({ key, default: defaultValue });
    mockRecoilStates[key] = atom;
    return atom;
};

// Define atoms that are used if not already by initializeRecoilMock default pass-through
// This ensures they are in mockRecoilStates if needed for direct manipulation in tests,
// though initializeRecoilMock tries to catch them via pass-through.
mockRecoilAtom('cartState', undefined);
mockRecoilAtom('cartIdState', undefined);
mockRecoilAtom('defaultBlvdLocationState', undefined);
mockRecoilAtom('successBookingCartInfoState', undefined);
mockRecoilAtom('cartDataLoaded', false);
// ... other atoms used in the module if any ...
// Atoms from other modules that are used (like activeSelectedServiceState, bookableStaffVariantsState)
// should ideally be mocked where they are defined or here if they are directly imported and used.
// For now, we rely on the jest.mock for the modules and the setters being captured.

// activeSelectedServiceState and bookableStaffVariantsState are crucial.
// Their setters (useSetRecoilState) are mocked to capture calls.
// Their values (useRecoilValue) would be mocked if read directly by cartMethods.
// The test focuses on cartMethods calling the setters correctly.
mockRecoilAtom('activeSelectedServiceState', undefined);
mockRecoilAtom('bookableStaffVariantsState', []);
mockRecoilAtom('cartBookableItemListStaffState', []);

// Ensure that the `cartAvailableBookableItemStaffVariantToStaff` function is accounted for.
// It's imported from 'lib/state/staff'. If it's simple enough, we can replicate its behavior
// or ensure the mock for `useSetBookableStaffVariants` expects values as if they've been through this transform.
// For these tests, we are checking the raw staff variant data passed to `setBookableStaffVariants`,
// assuming `cartAvailableBookableItemStaffVariantToStaff` does its job correctly.
// A more integrated test might mock `cartAvailableBookableItemStaffVariantToStaff` itself.
jest.mock('lib/state/staff', () => {
    const originalStaff = jest.requireActual('lib/state/staff');
    return {
        ...originalStaff,
        useSetBookableStaffVariants: () => mockSetBookableStaffVariants, // Ensure our mock is used
        useSetAllowChooseStaffError: () => mockSetAllowChooseStaffError, // Ensure our mock is used
        cartAvailableBookableItemStaffVariantToStaff: jest.fn(sv => ({ ...sv.staff, staffVariant: sv })), // Simplified mock
        useSetCartBookableItemListStaff: jest.fn(() => jest.fn()),
        // Mock other exports if useCartMethods uses them
    };
});
