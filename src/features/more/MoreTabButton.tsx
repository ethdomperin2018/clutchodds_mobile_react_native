import { router, type Href } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  NavIconBookmakers,
  NavIconMyBets,
  NavIconProfile,
} from "@/components/icons/appNavIcons";
import { colors, radii } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

type MenuItem = {
  href: Href;
  label: string;
  Icon: typeof NavIconMyBets;
};

const MENU_ITEMS: MenuItem[] = [
  {
    href: "/(app)/(tabs)/my-bets" as Href,
    label: "My Bets",
    Icon: NavIconMyBets,
  },
  {
    href: "/(app)/(tabs)/bookmakers" as Href,
    label: "Bookmakers",
    Icon: NavIconBookmakers,
  },
  {
    href: "/(app)/(tabs)/profile" as Href,
    label: "Profile",
    Icon: NavIconProfile,
  },
];

type MoreTabButtonProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  href?: string | object | null;
  onPress?: unknown;
  [key: string]: unknown;
};

export function MoreTabButton({ children, style }: MoreTabButtonProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const buttonRef = useRef<View | null>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ right: 12, bottom: 72 });

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    const show = (x: number, y: number, width: number) => {
      const menuWidth = 188;
      const centeredRight = windowWidth - (x + width / 2) - menuWidth / 2;
      const right = Math.min(
        Math.max(8, centeredRight),
        windowWidth - menuWidth - 8
      );
      const bottom = Math.max(8, windowHeight - y + 10);
      setMenuPos({ right, bottom });
      setOpen(true);
    };

    if (buttonRef.current?.measureInWindow) {
      buttonRef.current.measureInWindow((x, y, width) => show(x, y, width));
      return;
    }

    show(windowWidth - 56, windowHeight - 64, 48);
  }, [windowHeight, windowWidth]);

  const onSelect = (href: Href) => {
    close();
    router.push(href);
  };

  return (
    <>
      <View ref={buttonRef} collapsable={false} style={styles.buttonWrap}>
        <Pressable
          accessibilityLabel="More"
          accessibilityRole="button"
          accessibilityState={{ selected: open }}
          onPress={(event) => {
            if (Platform.OS === "web") {
              event.preventDefault?.();
              const native = event.nativeEvent as {
                preventDefault?: () => void;
              };
              native.preventDefault?.();
            }
            openMenu();
          }}
          style={[style, styles.pressable]}
        >
          {children}
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={close}
        transparent
        visible={open}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Dismiss menu"
            onPress={close}
            style={styles.backdrop}
          />
          <View
            pointerEvents="box-none"
            style={[
              styles.menu,
              { right: menuPos.right, bottom: menuPos.bottom },
            ]}
          >
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => onSelect(item.href)}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed ? styles.menuItemPressed : null,
                ]}
              >
                <item.Icon color={colors.text} size={18} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonWrap: {
    flex: 1,
  },
  pressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  menu: {
    position: "absolute",
    width: 188,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "#121212",
    paddingVertical: 6,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  menuLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.text,
    fontSize: 15,
  },
});
