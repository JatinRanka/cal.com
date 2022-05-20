import React, { useEffect, useState } from "react";
import Select from "react-select";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import Button from "@calcom/ui/Button";

import { trpc } from "@lib/trpc";

interface Props {
  onChange: (value: { externalId: string; integration: string }) => void;
  isLoading?: boolean;
  hidePlaceholder?: boolean;
  /** The external Id of the connected calendar */
  value: string | undefined;
}

const DestinationCalendarSelector = ({
  onChange,
  isLoading,
  value,
  hidePlaceholder,
}: Props): JSX.Element | null => {
  const { t } = useLocale();
  const query = trpc.useQuery(["viewer.connectedCalendars"]);
  const [selectedOption, setSelectedOption] = useState<{ value: string; label: string } | null>(null);

  useEffect(() => {
    const selected = query.data?.connectedCalendars
      .map((connected) => connected.calendars ?? [])
      .flat()
      .find((cal) => cal.externalId === value);

    if (selected) {
      setSelectedOption({
        value: `${selected.integration}:${selected.externalId}`,
        label: selected.name || "",
      });
    }
  }, [query.data?.connectedCalendars, value]);

  if (!query.data?.connectedCalendars.length) {
    return null;
  }
  const options =
    query.data.connectedCalendars.map((selectedCalendar) => ({
      key: selectedCalendar.credentialId,
      label: `${selectedCalendar.integration.title} (${selectedCalendar.primary?.name})`,
      options: (selectedCalendar.calendars ?? []).map((cal) => ({
        label: cal.name || "",
        value: `${cal.integration}:${cal.externalId}`,
      })),
    })) ?? [];
  return (
    <div className="relative" title={`${t("select_destination_calendar")}: ${selectedOption?.label || ""}`}>
      {/* There's no easy way to customize the displayed value for a Select, so we fake it. */}
      {!hidePlaceholder && (
        <div className="pointer-events-none absolute z-10 w-full">
          <Button
            size="sm"
            color="secondary"
            className="m-[1px] w-[calc(100%_-_40px)] overflow-hidden overflow-ellipsis whitespace-nowrap rounded-sm border-none leading-5">
            {t("select_destination_calendar")}: {selectedOption?.label || ""}
          </Button>
        </div>
      )}
      <Select
        name={"primarySelectedCalendar"}
        placeholder={!hidePlaceholder ? `${t("select_destination_calendar")}:` : undefined}
        options={options}
        styles={{
          option: (defaultStyles, state) => ({
            ...defaultStyles,
            backgroundColor: state.isSelected
              ? state.isFocused
                ? "var(--brand-color)"
                : "var(--brand-color)"
              : state.isFocused
              ? "var(--brand-color-dark-mode)"
              : "var(--brand-text-color)",
          }),
        }}
        isSearchable={false}
        className="mt-1 mb-2 block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 sm:text-sm"
        onChange={(option) => {
          setSelectedOption(option);
          if (!option) {
            return;
          }

          /* Split only the first `:`, since Apple uses the full URL as externalId */
          const [integration, externalId] = option.value.split(/:(.+)/);

          onChange({
            integration,
            externalId,
          });
        }}
        isLoading={isLoading}
        value={selectedOption}
      />
    </div>
  );
};

export default DestinationCalendarSelector;
