"use client";

import { ComponentProps, useEffect, useState } from "react";
import { Drawer, DrawerHeader } from "sd-tnrsm-library";

export const RoutedDrawer = (
  props: Omit<ComponentProps<typeof Drawer>, "open">,
  cta?: ComponentProps<typeof DrawerHeader>["cta"]
) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  const close = () => {
    setOpen(false);
    setTimeout(props.handleOpenClose, 150);
  };

  return (
    <Drawer
      {...props}
      open={open}
      handleOpenClose={close}
      header={
        <DrawerHeader
          onClose={close}
          title={props.headerText}
          description={props.headerSubtext}
          color="blue"
          cta={cta}
        />
      }
    />
  );
};
