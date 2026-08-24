/**
 * Constrains the app to a phone-sized column. On real phones it fills the
 * screen; on larger screens it renders a centered phone-shaped device on a
 * neutral backdrop, so the experience is identical to mobile.
 *
 * The `translateZ(0)` transform makes this element the containing block for
 * `position: fixed` descendants, so modals/overlays stay inside the phone
 * instead of covering the whole desktop window.
 */
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-neutral-200 dark:bg-neutral-950 sm:py-6">
      <div className="relative w-full max-w-[430px] min-h-[100dvh] overflow-x-hidden bg-canvas [transform:translateZ(0)] sm:h-[calc(100dvh-3rem)] sm:min-h-0 sm:max-h-[920px] sm:overflow-y-auto sm:rounded-[2.25rem] sm:border sm:border-line sm:shadow-2xl">
        {children}
      </div>
    </div>
  );
}
