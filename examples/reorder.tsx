import { createSignal, For } from "solid-js";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Stack,
  Typography,
  Button,
  Tabs,
  Tab,
  BottomNavigation,
  BottomNavigationAction,
  Stepper,
  Step,
  StepButton,
} from "../src";

/** An interactive example of implicit positions following keyed child order. */
export function ReorderExample(): JSX.Element {
  const initial = ["Alpha", "Beta", "Gamma"];
  const [items, setItems] = createSignal(initial);
  const [tab, setTab] = createSignal<unknown>(1);
  const [destination, setDestination] = createSignal<unknown>(1);
  const [activeStep, setActiveStep] = createSignal(1);
  const [lastChange, setLastChange] = createSignal(
    "Choose a tab or destination",
  );
  return (
    <ThemeProvider theme={createTheme()}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Reorder navigation</Typography>
          <Typography>
            Implicit values use each item's current position. The selected
            position stays at 1 as the items move.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() =>
                setItems((previous) => [...previous.slice(1), previous[0]])
              }
            >
              Rotate items
            </Button>
            <Button
              onClick={() => setItems((previous) => previous.slice(1))}
              disabled={items().length < 2}
            >
              Remove first
            </Button>
            <Button onClick={() => setItems(initial)}>Reset items</Button>
          </Stack>
          <Tabs
            aria-label="Reordered tabs"
            value={tab()}
            onChange={(_, value) => {
              setTab(value);
              setLastChange(`Tab position: ${String(value)}`);
            }}
          >
            <For each={items()}>{(name) => <Tab label={name} />}</For>
            <Tab label="Explicit value" value="fixed" />
          </Tabs>
          <BottomNavigation
            value={destination()}
            showLabels
            onChange={(_, value) => {
              setDestination(value);
              setLastChange(`Destination position: ${String(value)}`);
            }}
          >
            <For each={items()}>
              {(name) => <BottomNavigationAction label={name} />}
            </For>
            <BottomNavigationAction
              label="Explicit destination"
              value="fixed"
            />
          </BottomNavigation>
          <Stepper activeStep={activeStep()} nonLinear>
            <For each={items()}>
              {(name) => (
                <Step>
                  <StepButton
                    onClick={(event) =>
                      setActiveStep(
                        Number(
                          (event.currentTarget as HTMLElement).getAttribute(
                            "aria-posinset",
                          ),
                        ) - 1,
                      )
                    }
                  >
                    {name}
                  </StepButton>
                </Step>
              )}
            </For>
            <Step index={9}>
              <StepButton>Explicit step</StepButton>
            </Step>
          </Stepper>
          <Typography role="status">{lastChange()}</Typography>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}

/** Mount this standalone example from a development page. */
export function mountReorderExample(element: HTMLElement): () => void {
  return render(() => <ReorderExample />, element);
}
