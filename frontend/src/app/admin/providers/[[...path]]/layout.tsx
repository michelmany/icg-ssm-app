interface ProvidersLayout {
  children?: React.ReactNode | undefined;
  add?: React.ReactNode | undefined;
  edit?: React.ReactNode | undefined;
  view?: React.ReactNode | undefined;
}

export default async function Layout({
  children,
  add,
  edit,
  view,
}: ProvidersLayout) {
  return (
    <>
      {add}
      {edit}
      {view}
      {children}
    </>
  );
}
