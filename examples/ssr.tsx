import { createSignal } from "solid-js";
import { renderToString, generateHydrationScript } from "@solidjs/web";
import {
  StyledEngineProvider,
  createStyleCache,
  getStyleTag,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Stack,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  Slider,
  Rating,
  Chip,
} from "../src";

/** The same component is rendered on the server and hydrated by the client. */
export function ServerGallery() {
  const [name, setName] = createSignal("Alex Morgan");
  const [plan, setPlan] = createSignal("priority");
  const [notifications, setNotifications] = createSignal(true);
  const [rating, setRating] = createSignal<number | null>(4);
  const [saved, setSaved] = createSignal(false);
  return (
    <ThemeProvider theme={createTheme()}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4">
            Workspace preferences
          </Typography>
          <Chip
            label="Server rendering"
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          />
          <TextField
            label="Name"
            value={name()}
            onChange={(event) => {
              setName(event.currentTarget.value);
              setSaved(false);
            }}
          />
          <TextField
            select
            label="Subscription"
            value={plan()}
            onChange={(event) => {
              setPlan((event.target as HTMLInputElement).value);
              setSaved(false);
            }}
          >
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="team">Team</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={notifications()}
                onChange={(_, value) => {
                  setNotifications(value);
                  setSaved(false);
                }}
              />
            }
            label="Notifications"
          />
          <Slider
            aria-label="Storage allocation"
            defaultValue={35}
            valueLabelDisplay="auto"
          />
          <Rating
            name="workspace-rating"
            value={rating()}
            onChange={(_, value) => setRating(value)}
          />
          <Button variant="contained" onClick={() => setSaved(true)}>
            Save preferences
          </Button>
          {saved() && (
            <Alert severity="success">Preferences saved for {name()}.</Alert>
          )}
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
export function renderServerPage(): {
  markup: string;
  styles: string;
  hydrationScript: string;
} {
  const cache = createStyleCache({ key: "mui-ssr" });
  const markup = renderToString(() => (
    <StyledEngineProvider cache={cache}>
      <ServerGallery />
    </StyledEngineProvider>
  ));
  return {
    markup,
    styles: getStyleTag(cache),
    hydrationScript: generateHydrationScript(),
  };
}
