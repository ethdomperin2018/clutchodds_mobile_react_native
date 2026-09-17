import type { ReactNode } from "react";
import { Modal, type ModalProps } from "react-native";

type FullScreenModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
  animationType?: NonNullable<ModalProps["animationType"]>;
};

/** Covers the full window, including chrome outside the tab screen. */
export function FullScreenModal({
  visible,
  onRequestClose,
  children,
  animationType = "fade",
}: FullScreenModalProps) {
  return (
    <Modal
      animationType={animationType}
      onRequestClose={onRequestClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      {children}
    </Modal>
  );
}
