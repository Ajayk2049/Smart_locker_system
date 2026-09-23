import React from "react";
import { PrepareModal } from "../modals/PrepareModal";
import { DispatchModal } from "../modals/DispatchModal";
import { DeliveredModal } from "../modals/DeliveredModal";
import { RejectModal } from "../modals/RejectModal";

export interface DashboardModalsProps {
  prepareModalData: {
    requestId: string;
    customerName: string;
    units: number;
    suggestedDeviceId: string;
  } | null;
  assignDeviceIdInput: string;
  onAssignDeviceIdChange: (val: string) => void;
  prepareNotesInput: string;
  onPrepareNotesChange: (val: string) => void;
  onClosePrepare: () => void;
  onConfirmPrepare: () => void;

  dispatchModalData: {
    requestId: string;
    customerName: string;
    deviceId: string;
  } | null;
  dispatchNotesInput: string;
  onDispatchNotesChange: (val: string) => void;
  onCloseDispatch: () => void;
  onConfirmDispatch: () => void;

  deliverModalData: {
    requestId: string;
    customerName: string;
    phone: string;
    deviceId: string;
  } | null;
  callVerificationInput: string;
  onCallVerificationChange: (val: string) => void;
  onCloseDeliver: () => void;
  onConfirmDeliver: () => void;

  rejectModalData: {
    requestId: string;
    customerName: string;
  } | null;
  rejectionReasonInput: string;
  onRejectionReasonChange: (val: string) => void;
  onCloseReject: () => void;
  onConfirmReject: () => void;
}

export function DashboardModals({
  prepareModalData,
  assignDeviceIdInput,
  onAssignDeviceIdChange,
  prepareNotesInput,
  onPrepareNotesChange,
  onClosePrepare,
  onConfirmPrepare,

  dispatchModalData,
  dispatchNotesInput,
  onDispatchNotesChange,
  onCloseDispatch,
  onConfirmDispatch,

  deliverModalData,
  callVerificationInput,
  onCallVerificationChange,
  onCloseDeliver,
  onConfirmDeliver,

  rejectModalData,
  rejectionReasonInput,
  onRejectionReasonChange,
  onCloseReject,
  onConfirmReject,
}: DashboardModalsProps) {
  return (
    <>
      {prepareModalData && (
        <PrepareModal
          data={prepareModalData}
          deviceIdInput={assignDeviceIdInput}
          onDeviceIdChange={onAssignDeviceIdChange}
          notesInput={prepareNotesInput}
          onNotesChange={onPrepareNotesChange}
          onClose={onClosePrepare}
          onConfirm={onConfirmPrepare}
        />
      )}

      {dispatchModalData && (
        <DispatchModal
          data={dispatchModalData}
          notesInput={dispatchNotesInput}
          onNotesChange={onDispatchNotesChange}
          onClose={onCloseDispatch}
          onConfirm={onConfirmDispatch}
        />
      )}

      {deliverModalData && (
        <DeliveredModal
          data={deliverModalData}
          verificationInput={callVerificationInput}
          onVerificationChange={onCallVerificationChange}
          onClose={onCloseDeliver}
          onConfirm={onConfirmDeliver}
        />
      )}

      {rejectModalData && (
        <RejectModal
          data={rejectModalData}
          reasonInput={rejectionReasonInput}
          onReasonChange={onRejectionReasonChange}
          onClose={onCloseReject}
          onConfirm={onConfirmReject}
        />
      )}
    </>
  );
}
