export enum Step {
    LoadingStep,
    ChooseLocation,
    SearchClient,
    SelectService,
    SelectOptions,
    SelectedServices,
    ChooseDate,
    PersonalInfo,
    PayAndConfirm,
    BookingSuccess,
}

export interface Types {
    step: Step
}

export const initialStep: Step = Step.LoadingStep
