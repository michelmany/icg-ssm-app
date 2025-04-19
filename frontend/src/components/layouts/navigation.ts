import { NavigationItem } from "sd-tnrsm-library";

export const setActiveNavigationItem = (
  item: Omit<NavigationItem, "active" | "subMenu"> & {
    subMenu: Omit<NavigationItem["subMenu"][number], "active">[];
  },
  pathname: string,
) => {
  if (item.subMenu?.length) {
    const subMenu = item.subMenu.map((subMenuItem) => ({
      ...subMenuItem,
      active: subMenuItem.href === pathname,
    }));

    return {
      ...item,
      subMenu,
      active: subMenu.some((item) => item.active),
    } as NavigationItem;
  }

  const active =
    !!item.href &&
    ((["/dashboard", "/admin"].includes(item.href) && pathname === item.href) ||
      (!["/dashboard", "/admin"].includes(item.href) &&
        pathname.startsWith(item.href)));

  return {
    ...item,
    active,
  } as NavigationItem;
};
