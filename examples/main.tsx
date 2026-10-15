import { createMemo, createSignal, For, Show } from "solid-js";
import { render } from "@solidjs/web";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import {
  CssVarsProvider,
  extendTheme,
  useColorScheme,
  useTheme,
  type ReducedMotionMode,
  styled,
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles,
  Box,
  Stack,
  Grid,
  Container,
  Typography,
  Divider,
  Paper,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Fab,
  ButtonGroup,
  Checkbox,
  Switch,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Slider,
  Rating,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  AvatarGroup,
  Badge,
  Chip,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  TablePagination,
  Tabs,
  Tab,
  Pagination,
  BottomNavigation,
  BottomNavigationAction,
  Breadcrumbs,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  MobileStepper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Tooltip,
  Drawer,
  SwipeableDrawer,
  Menu,
  Popover,
  Collapse,
} from "../src";
import MenuIcon from "../src/icons/Menu";
import DarkMode from "../src/icons/DarkMode";
import LightMode from "../src/icons/LightMode";
import Add from "../src/icons/Add";
import Favorite from "../src/icons/Favorite";
import Home from "../src/icons/Home";
import Settings from "../src/icons/Settings";
import Layers from "../src/icons/Layers";
import ExpandMore from "../src/icons/ExpandMore";
import FormatBold from "../src/icons/FormatBold";
import FormatItalic from "../src/icons/FormatItalic";
import Share from "../src/icons/Share";
import Save from "../src/icons/Save";
import Delete from "../src/icons/Delete";
import Notifications from "../src/icons/Notifications";

const sections = [
  "Inputs",
  "Surfaces",
  "Navigation",
  "Feedback",
  "Data display",
  "Layout",
  "Theming",
] as const;
type Section = (typeof sections)[number];
function App() {
  const [section, setSection] = createSignal<Section>("Inputs");
  const [dark, setDark] = createSignal(false);
  const [mobileNav, setMobileNav] = createSignal(false);
  const theme = createMemo(() =>
    createTheme({
      palette: { mode: dark() ? "dark" : "light" },
      components: {
        MuiCssBaseline: {
          styleOverrides: (theme) => ({
            "::selection": {
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
            },
          }),
        },
      },
    }),
  );
  const nav = () => (
    <List disablePadding aria-label="Components">
      <For each={sections}>
        {(s) => (
          <ListItemButton
            selected={section() === s}
            onClick={() => {
              setSection(s);
              setMobileNav(false);
              window.scrollTo(0, 0);
            }}
            sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}
          >
            <ListItemText primary={s} />
          </ListItemButton>
        )}
      </For>
    </List>
  );
  return (
    <ThemeProvider theme={theme()}>
      <CssBaseline enableColorScheme />
      <GlobalStyles
        styles={(t) => ({
          ".showcase-row": {
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          },
          ".example-section": { marginBottom: 48 },
          ".example-title": { marginBottom: 20 },
          ".nav-rail": {
            width: 224,
            position: "fixed",
            left: 0,
            top: 64,
            bottom: 0,
            paddingTop: 24,
            borderRight: `1px solid ${t.palette.divider}`,
            display: "none",
            [t.breakpoints.up("md")]: { display: "block" },
          },
          ".showcase-main": {
            marginLeft: 0,
            paddingTop: 32,
            paddingBottom: 64,
            [t.breakpoints.up("md")]: { marginLeft: 224 },
          },
          ".demo-grid": {
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 32,
            [t.breakpoints.up("sm")]: { gridTemplateColumns: "1fr 1fr" },
          },
        })}
      />
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            aria-label="Open component navigation"
            color="inherit"
            edge="start"
            sx={{ display: { md: "none" } }}
            onClick={() => setMobileNav(true)}
          >
            <MenuIcon />
          </IconButton>
          <Layers sx={{ mr: 1.5 }} />
          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{ flexGrow: 1, minWidth: 0, fontSize: { xs: 18, sm: 20 } }}
          >
            Material UI{" "}
            <Box component="span" sx={{ opacity: 0.7, fontWeight: 400, ml: 1 }}>
              Solid 2
            </Box>
          </Typography>
          <Tooltip title={dark() ? "Light mode" : "Dark mode"}>
            <IconButton
              color="inherit"
              aria-label={dark() ? "Light mode" : "Dark mode"}
              onClick={() => setDark((v) => !v)}
            >
              {dark() ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box component="nav" class="nav-rail">
        {nav()}
      </Box>
      <Drawer open={mobileNav()} onClose={() => setMobileNav(false)}>
        <Box sx={{ width: 240, p: 2 }}>{nav()}</Box>
      </Drawer>
      <Box component="main" class="showcase-main">
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom>
            {section()}
          </Typography>
          <Divider sx={{ mb: 4 }} />
          <Show when={section() === "Inputs"}>
            <InputsPage />
          </Show>
          <Show when={section() === "Surfaces"}>
            <SurfacesPage />
          </Show>
          <Show when={section() === "Navigation"}>
            <NavigationPage />
          </Show>
          <Show when={section() === "Feedback"}>
            <FeedbackPage />
          </Show>
          <Show when={section() === "Data display"}>
            <DataPage />
          </Show>
          <Show when={section() === "Layout"}>
            <LayoutPage />
          </Show>
          <Show when={section() === "Theming"}>
            <ThemingPage />
          </Show>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
function Example(p: {
  title: string;
  children?: import("@solidjs/web").JSX.Element;
}) {
  return (
    <section class="example-section">
      <Typography component="h3" variant="h6" class="example-title">
        {p.title}
      </Typography>
      {p.children}
    </section>
  );
}
function InputsPage() {
  const [enabled, setEnabled] = createSignal(true);
  const [radio, setRadio] = createSignal("standard");
  const [format, setFormat] = createSignal<unknown>(["bold"]);
  const [volume, setVolume] = createSignal<number | number[]>(35);
  const [rating, setRating] = createSignal<number | null>(3);
  const [fruit, setFruit] = createSignal<unknown>("apple");
  const [auto, setAuto] = createSignal<string | null>(null);
  const [mapped, setMapped] = createSignal<number | null>(null);
  const [saved, setSaved] = createSignal(false);
  return (
    <>
      <Example title="Buttons">
        <Stack spacing={3}>
          <div class="showcase-row">
            <Button variant="contained" onClick={() => setSaved(true)}>
              Contained
            </Button>
            <Button variant="outlined">Outlined</Button>
            <Button>Text</Button>
            <Button variant="contained" disabled>
              Disabled
            </Button>
            <Button variant="contained" loading>
              Saving
            </Button>
          </div>
          <div class="showcase-row">
            <Button variant="contained" color="secondary" startIcon={<Save />}>
              Save
            </Button>
            <Button variant="outlined" color="error" startIcon={<Delete />}>
              Delete
            </Button>
            <Tooltip title="Add">
              <IconButton aria-label="Add">
                <Add />
              </IconButton>
            </Tooltip>
            <Fab color="primary" aria-label="Create">
              <Add />
            </Fab>
            <ButtonGroup variant="outlined">
              <Button>One</Button>
              <Button>Two</Button>
              <Button>Three</Button>
            </ButtonGroup>
          </div>
        </Stack>
      </Example>
      <Example title="Selection">
        <div class="demo-grid">
          <Stack>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Notifications"
            />
            <FormControlLabel
              control={<Checkbox indeterminate />}
              label="Some selected"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={enabled()}
                  onChange={(_, value) => setEnabled(value)}
                />
              }
              label="Sync enabled"
            />
          </Stack>
          <RadioGroup
            value={radio()}
            onChange={(_, value) => setRadio(value)}
            aria-label="Subscription"
          >
            <FormControlLabel
              control={<Radio value="standard" />}
              label="Standard"
            />
            <FormControlLabel
              control={<Radio value="priority" />}
              label="Priority"
            />
          </RadioGroup>
        </div>
      </Example>
      <Example title="Text fields">
        <div class="demo-grid">
          <TextField label="Name" defaultValue="Alex Morgan" />
          <TextField
            label="Email"
            type="email"
            placeholder="alex@example.com"
            helperText="Work email"
          />
          <TextField variant="filled" label="Company" />
          <TextField variant="standard" label="Website" />
          <TextField label="Password" type="password" defaultValue="material" />
          <TextField label="Required field" error helperText="Enter a value" />
          <TextField label="Notes" multiline minRows={3} />
          <TextField label="Disabled" disabled defaultValue="Read only" />
        </div>
      </Example>
      <Example title="Select and autocomplete">
        <div class="demo-grid">
          <FormControl fullWidth>
            <InputLabel id="fruit-label">Fruit</InputLabel>
            <Select
              labelId="fruit-label"
              label="Fruit"
              value={fruit()}
              onChange={(event) =>
                setFruit((event.target as { value: unknown }).value)
              }
            >
              <MenuItem value="apple">Apple</MenuItem>
              <MenuItem value="orange">Orange</MenuItem>
              <MenuItem value="pear">Pear</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            options={[
              "Amsterdam",
              "Chicago",
              "Copenhagen",
              "London",
              "New York",
              "Tokyo",
            ]}
            value={auto()}
            onChange={(_, value) => setAuto(value)}
            renderInput={(params) => <TextField {...params} label="City" />}
          />
        </div>
      </Example>
      <Example title="Mapped autocomplete">
        <Autocomplete
          options={[
            { id: 1, label: "Alpha" },
            { id: 2, label: "Beta" },
            { id: 3, label: "Gamma" },
          ]}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.id}
          value={mapped()}
          onChange={(_, value) => setMapped(value)}
          renderInput={(params) => <TextField {...params} label="Project" />}
          sx={{ maxWidth: 480 }}
        />
      </Example>
      <Example title="Slider and rating">
        <div class="demo-grid">
          <Stack spacing={2} sx={{ px: 1 }}>
            <Slider
              aria-label="Volume"
              value={volume()}
              onChange={(_, value) => setVolume(value)}
              valueLabelDisplay="auto"
            />
            <Slider
              aria-label="Price range"
              defaultValue={[20, 70]}
              marks
              step={10}
            />
          </Stack>
          <Stack spacing={2}>
            <Rating
              name="rating"
              value={rating()}
              onChange={(_, value) => setRating(value)}
            />
            <ToggleButtonGroup
              value={format()}
              onChange={(_, value) => setFormat(value)}
              aria-label="Formatting"
            >
              <ToggleButton value="bold" aria-label="Bold">
                <FormatBold />
              </ToggleButton>
              <ToggleButton value="italic" aria-label="Italic">
                <FormatItalic />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </div>
      </Example>
      <Snackbar
        open={saved()}
        autoHideDuration={2500}
        onClose={() => setSaved(false)}
        message="Saved"
      />
    </>
  );
}
function SurfacesPage() {
  return (
    <>
      <Example title="Paper">
        <div class="showcase-row">
          <For each={[0, 1, 3, 8]}>
            {(elevation) => (
              <Paper
                elevation={elevation}
                sx={{ p: 3, width: 120, textAlign: "center" }}
              >
                Elevation {elevation}
              </Paper>
            )}
          </For>
          <Paper variant="outlined" sx={{ p: 3 }}>
            Outlined
          </Paper>
        </div>
      </Example>
      <Example title="Cards">
        <div class="demo-grid">
          <Card>
            <CardHeader
              avatar={<Avatar>A</Avatar>}
              title="Weekend plans"
              subheader="October 13, 2026"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                A walk by the lake, a good book, and a quiet afternoon.
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton aria-label="Favorite">
                <Favorite />
              </IconButton>
              <IconButton aria-label="Share">
                <Share />
              </IconButton>
            </CardActions>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Design with purpose
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clear hierarchy. Familiar controls. Space for the content.
              </Typography>
            </CardContent>
            <CardActions>
              <Button>Learn more</Button>
            </CardActions>
          </Card>
        </div>
      </Example>
      <Example title="Accordions">
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            General settings
          </AccordionSummary>
          <AccordionDetails>
            <TextField label="Display name" defaultValue="Alex" fullWidth />
          </AccordionDetails>
          <AccordionActions>
            <Button>Reset</Button>
            <Button variant="contained">Save</Button>
          </AccordionActions>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            Privacy
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Keep profile private"
            />
          </AccordionDetails>
        </Accordion>
        <Accordion disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            Organization settings
          </AccordionSummary>
        </Accordion>
      </Example>
      <Example title="App bar">
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flex: 1 }}>
              My workspace
            </Typography>
            <IconButton color="inherit" aria-label="Settings">
              <Settings />
            </IconButton>
          </Toolbar>
        </AppBar>
      </Example>
    </>
  );
}
function NavigationPage() {
  const [tab, setTab] = createSignal<unknown>(0);
  const [page, setPage] = createSignal(1);
  const [bottom, setBottom] = createSignal<unknown>(0);
  const [step, setStep] = createSignal(0);
  return (
    <>
      <Example title="Tabs">
        <Tabs
          value={tab()}
          onChange={(_, value) => setTab(value)}
          aria-label="Workspace views"
        >
          <Tab label="Overview" />
          <Tab label="Activity" />
          <Tab label="Settings" />
        </Tabs>
        <Paper variant="outlined" sx={{ p: 3, borderTop: 0 }} role="tabpanel">
          {["Overview", "Activity", "Settings"][Number(tab())]}
        </Paper>
      </Example>
      <Example title="Breadcrumbs">
        <Breadcrumbs aria-label="Breadcrumb">
          <Link href="#">Home</Link>
          <Link href="#">Workspace</Link>
          <Typography color="text.primary">Project</Typography>
        </Breadcrumbs>
      </Example>
      <Example title="Pagination">
        <Pagination
          count={10}
          page={page()}
          onChange={(_, value) => setPage(value)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Example>
      <Example title="Stepper">
        <Stepper activeStep={step()}>
          <Step>
            <StepLabel>Account</StepLabel>
          </Step>
          <Step>
            <StepLabel>Preferences</StepLabel>
          </Step>
          <Step>
            <StepLabel>Finish</StepLabel>
          </Step>
        </Stepper>
        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button disabled={step() === 0} onClick={() => setStep((n) => n - 1)}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => setStep((n) => (n + 1) % 3)}
          >
            {step() === 2 ? "Restart" : "Next"}
          </Button>
        </Stack>
      </Example>
      <Example title="Bottom navigation">
        <Paper elevation={2} sx={{ maxWidth: 500 }}>
          <BottomNavigation
            value={bottom()}
            onChange={(_, value) => setBottom(value)}
            showLabels
          >
            <BottomNavigationAction label="Home" icon={<Home />} />
            <BottomNavigationAction label="Favorites" icon={<Favorite />} />
            <BottomNavigationAction label="Settings" icon={<Settings />} />
          </BottomNavigation>
        </Paper>
      </Example>
      <Example title="Speed dial">
        <Box sx={{ position: "relative", height: 180 }}>
          <SpeedDial
            ariaLabel="Document actions"
            icon={<SpeedDialIcon />}
            direction="up"
            sx={{ position: "absolute", right: 0, bottom: 0 }}
          >
            <SpeedDialAction icon={<Save />} tooltipTitle="Save" />
            <SpeedDialAction icon={<Share />} tooltipTitle="Share" />
          </SpeedDial>
        </Box>
      </Example>
    </>
  );
}
function FeedbackPage() {
  const [dialog, setDialog] = createSignal(false);
  const [snack, setSnack] = createSignal(false);
  const [menu, setMenu] = createSignal(false);
  const [popover, setPopover] = createSignal(false);
  const [swipe, setSwipe] = createSignal(false);
  let menuButton!: HTMLButtonElement;
  let popoverButton!: HTMLButtonElement;
  return (
    <>
      <Example title="Alerts">
        <Stack spacing={2}>
          <For each={["success", "info", "warning", "error"] as const}>
            {(severity) => (
              <Alert severity={severity}>
                <AlertTitle>
                  {severity[0].toUpperCase() + severity.slice(1)}
                </AlertTitle>
                {
                  {
                    success: "Changes saved.",
                    info: "A new version is available.",
                    warning: "Your session expires soon.",
                    error: "Unable to save changes.",
                  }[severity]
                }
              </Alert>
            )}
          </For>
        </Stack>
      </Example>
      <Example title="Overlays">
        <div class="showcase-row">
          <Button variant="contained" onClick={() => setDialog(true)}>
            Open dialog
          </Button>
          <Button variant="outlined" onClick={() => setSnack(true)}>
            Show snackbar
          </Button>
          <Button
            variant="outlined"
            ref={(el) => (menuButton = el as HTMLButtonElement)}
            onClick={() => setMenu(true)}
          >
            Open menu
          </Button>
          <Button
            variant="outlined"
            ref={(el) => (popoverButton = el as HTMLButtonElement)}
            onClick={() => setPopover(true)}
          >
            Open popover
          </Button>
          <Tooltip title="Helpful context">
            <IconButton aria-label="Notification settings">
              <Notifications />
            </IconButton>
          </Tooltip>
        </div>
      </Example>
      <Example title="Swipeable drawer">
        <Button variant="outlined" onClick={() => setSwipe(true)}>
          Open swipeable drawer
        </Button>
        <SwipeableDrawer
          open={swipe()}
          onOpen={() => setSwipe(true)}
          onClose={() => setSwipe(false)}
        >
          <Box sx={{ width: 280, p: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h6">Workspace</Typography>
              <TextField label="Display name" defaultValue="Alex" />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Notifications"
              />
              <Button variant="contained" onClick={() => setSwipe(false)}>
                Done
              </Button>
            </Stack>
          </Box>
        </SwipeableDrawer>
      </Example>
      <Example title="Progress">
        <div class="demo-grid">
          <div class="showcase-row">
            <CircularProgress aria-label="Loading progress" />
            <CircularProgress
              variant="determinate"
              value={75}
              aria-label="Upload 75 percent"
            />
          </div>
          <Stack spacing={3}>
            <LinearProgress aria-label="Loading" />
            <LinearProgress
              variant="determinate"
              value={65}
              aria-label="Upload progress"
            />
          </Stack>
        </div>
      </Example>
      <Example title="Skeletons">
        <Stack spacing={1} sx={{ maxWidth: 360 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="65%" />
          <Skeleton variant="rounded" height={120} animation="wave" />
        </Stack>
      </Example>
      <Dialog
        open={dialog()}
        onClose={() => setDialog(false)}
        aria-labelledby="dialog-title"
      >
        <DialogTitle id="dialog-title">Save changes?</DialogTitle>
        <DialogContent>
          <Typography>
            Your preferences will be updated for this workspace.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setDialog(false);
              setSnack(true);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack()}
        autoHideDuration={3000}
        onClose={() => setSnack(false)}
        message="Preferences saved"
      />
      <Menu
        open={menu()}
        anchorEl={() => menuButton}
        onClose={() => setMenu(false)}
      >
        <MenuItem onClick={() => setMenu(false)}>Profile</MenuItem>
        <MenuItem onClick={() => setMenu(false)}>Settings</MenuItem>
        <Divider />
        <MenuItem onClick={() => setMenu(false)}>Sign out</MenuItem>
      </Menu>
      <Popover
        open={popover()}
        anchorEl={() => popoverButton}
        onClose={() => setPopover(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Typography sx={{ p: 2 }}>Workspace details</Typography>
      </Popover>
    </>
  );
}
const rows = [
  { name: "Frozen yogurt", calories: 159, fat: 6 },
  { name: "Ice cream sandwich", calories: 237, fat: 9 },
  { name: "Eclair", calories: 262, fat: 16 },
  { name: "Cupcake", calories: 305, fat: 3.7 },
  { name: "Gingerbread", calories: 356, fat: 16 },
];
function DataPage() {
  const [page, setPage] = createSignal(0);
  const [perPage, setPerPage] = createSignal(5);
  const [sort, setSort] = createSignal<"asc" | "desc">("asc");
  const sorted = createMemo(() =>
    [...rows].sort((a, b) =>
      sort() === "asc" ? a.calories - b.calories : b.calories - a.calories,
    ),
  );
  return (
    <>
      <Example title="Avatars and badges">
        <div class="showcase-row">
          <Avatar>A</Avatar>
          <Avatar variant="rounded" sx={{ bgcolor: "secondary.main" }}>
            B
          </Avatar>
          <AvatarGroup max={3}>
            <Avatar>A</Avatar>
            <Avatar>B</Avatar>
            <Avatar>C</Avatar>
            <Avatar>D</Avatar>
            <Avatar>E</Avatar>
          </AvatarGroup>
          <Badge badgeContent={4} color="error">
            <Notifications />
          </Badge>
          <Badge variant="dot" color="success">
            <Avatar>M</Avatar>
          </Badge>
        </div>
      </Example>
      <Example title="Chips">
        <div class="showcase-row">
          <Chip label="Default" />
          <Chip label="Primary" color="primary" />
          <Chip label="Outlined" variant="outlined" />
          <Chip label="Alex Morgan" avatar={<Avatar>A</Avatar>} />
          <Chip
            label="Removable"
            onDelete={(event) =>
              (event.currentTarget as HTMLElement)
                .closest(".MuiChip-root")
                ?.remove()
            }
          />
        </div>
      </Example>
      <Example title="Lists">
        <List
          sx={{ maxWidth: 420 }}
          subheader={<ListSubheader>Workspace</ListSubheader>}
        >
          <ListItemButton>
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Home" secondary="Your recent activity" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon>
              <Favorite />
            </ListItemIcon>
            <ListItemText primary="Favorites" />
          </ListItemButton>
          <Divider />
          <ListItemButton>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </List>
      </Example>
      <Example title="Table">
        <TableContainer
          component={Paper}
          sx={{ border: 1, borderColor: "divider" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dessert</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active
                    direction={sort()}
                    onClick={() =>
                      setSort((v) => (v === "asc" ? "desc" : "asc"))
                    }
                  >
                    Calories
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Fat (g)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <For
                each={sorted().slice(
                  page() * perPage(),
                  (page() + 1) * perPage(),
                )}
              >
                {(row) => (
                  <TableRow hover>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell align="right">{row.calories}</TableCell>
                    <TableCell align="right">{row.fat}</TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={rows.length}
          page={page()}
          rowsPerPage={perPage()}
          rowsPerPageOptions={[2, 5]}
          onPageChange={(_, value) => setPage(value)}
          onRowsPerPageChange={(event) => {
            setPerPage(Number(event.currentTarget.value));
            setPage(0);
          }}
        />
      </Example>
    </>
  );
}
function LayoutPage() {
  return (
    <>
      <Example title="Grid">
        <Grid container spacing={2}>
          <For each={[8, 4, 4, 4, 4, 6, 6]}>
            {(size) => (
              <Grid size={{ xs: 12, sm: size }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 3, textAlign: "center", bgcolor: "action.hover" }}
                >
                  {size} / 12
                </Paper>
              </Grid>
            )}
          </For>
        </Grid>
      </Example>
      <Example title="Stack">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <For each={[1, 2, 3]}>
            {(n) => (
              <Paper sx={{ p: 3, flex: 1, textAlign: "center" }}>
                Item {n}
              </Paper>
            )}
          </For>
        </Stack>
      </Example>
      <Example title="Typography">
        <Stack spacing={2}>
          <Typography variant="h3">Material typography</Typography>
          <Typography variant="h5">A consistent type scale</Typography>
          <Typography variant="body1">
            Body text keeps longer passages easy to read, with familiar rhythm
            and spacing.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Secondary text supports the main content.
          </Typography>
          <Typography variant="caption">Caption · supporting detail</Typography>
        </Stack>
      </Example>
    </>
  );
}
const ThemedPanel = styled(Paper, {
  name: "DemoPanel",
  shouldForwardProp: (key) => key !== "accent",
})<{ accent: string }>(({ theme, accent }) => ({
  borderTop: `4px solid ${accent}`,
  padding: theme.spacing(3),
}));
function ThemingPage() {
  const [accent, setAccent] = createSignal("#1976d2");
  const [compact, setCompact] = createSignal(false);
  const [rounded, setRounded] = createSignal(false);
  const [nativeColor, setNativeColor] = createSignal(false);
  const [layers, setLayers] = createSignal(false);
  const [motion, setMotion] = createSignal<ReducedMotionMode>("never");
  const theme = createMemo(() =>
    extendTheme({
      motion: { reducedMotion: motion() },
      nativeColor: nativeColor(),
      modularCssLayers: layers(),
      cssVariables: { cssVarPrefix: "demo", rootSelector: ".theme-preview" },
      colorSchemes: {
        light: { palette: { primary: { main: accent() } } },
        dark: { palette: { primary: { main: accent() } } },
      },
      shape: { borderRadius: rounded() ? 16 : 4 },
      components: {
        MuiButton: {
          defaultProps: {
            size: compact() ? "small" : "medium",
            disableElevation: true,
          },
          styleOverrides: { root: { textTransform: "none" } },
        },
        MuiPaper: {
          styleOverrides: { root: { transition: "border-radius 200ms" } },
        },
        MuiChip: { styleOverrides: { label: { fontWeight: 700 } } },
      },
    }),
  );
  return (
    <>
      <Example title="Theme controls">
        <div class="showcase-row">
          <TextField
            select
            label="Primary color"
            value={accent()}
            onChange={(event) =>
              setAccent(String((event.target as HTMLInputElement).value))
            }
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="#1976d2">Blue</MenuItem>
            <MenuItem value="#008577">Teal</MenuItem>
            <MenuItem value="#c62828">Red</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={compact()}
                onChange={(_, value) => setCompact(value)}
              />
            }
            label="Compact buttons"
          />
          <FormControlLabel
            control={
              <Switch
                checked={rounded()}
                onChange={(_, value) => setRounded(value)}
              />
            }
            label="Rounded surfaces"
          />
          <FormControlLabel
            control={
              <Switch
                checked={nativeColor()}
                onChange={(_, value) => setNativeColor(value)}
              />
            }
            label="Native colors"
          />
          <FormControlLabel
            control={
              <Switch
                checked={layers()}
                onChange={(_, value) => setLayers(value)}
              />
            }
            label="CSS layers"
          />
          <TextField
            select
            label="Reduced motion"
            value={motion()}
            onChange={(event) =>
              setMotion(
                (event.target as HTMLInputElement).value as ReducedMotionMode,
              )
            }
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="never">Never</MenuItem>
            <MenuItem value="system">System</MenuItem>
            <MenuItem value="always">Always</MenuItem>
          </TextField>
        </div>
      </Example>
      <CssVarsProvider
        theme={theme()}
        defaultMode="light"
        modeStorageKey="mui-demo-preview-mode"
      >
        <ThemingPreview accent={accent()} />
      </CssVarsProvider>
    </>
  );
}
function ThemingPreview(p: { accent: string }) {
  const scheme = useColorScheme();
  const theme = useTheme();
  const [savedName, setSavedName] = createSignal("Material workspace");
  const [projectName, setProjectName] = createSignal("Material workspace");
  const saved = () => projectName() === savedName();
  return (
    <Example title="Preview">
      <ThemedPanel accent={p.accent} class="theme-preview">
        <Stack spacing={3}>
          <div class="showcase-row">
            <Typography variant="h5" sx={{ flex: 1 }}>
              Workspace preferences
            </Typography>
            <IconButton
              aria-label={
                scheme.mode() === "dark"
                  ? "Preview light mode"
                  : "Preview dark mode"
              }
              onClick={() =>
                scheme.setMode(scheme.mode() === "dark" ? "light" : "dark")
              }
            >
              {scheme.mode() === "dark" ? <LightMode /> : <DarkMode />}
            </IconButton>
          </div>
          <div class="showcase-row">
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => setSavedName(projectName())}
            >
              Save changes
            </Button>
            <Button
              variant="outlined"
              disabled={saved()}
              onClick={() => setProjectName(savedName())}
            >
              Cancel
            </Button>
            <Chip label="Customized" color="primary" />
          </div>
          <TextField
            fullWidth
            label="Project name"
            value={projectName()}
            onChange={(event) => setProjectName(event.currentTarget.value)}
          />
          <Collapse in={saved()}>
            <Alert severity="success">Preferences saved.</Alert>
          </Collapse>
          <Box
            sx={{
              height: 8,
              borderRadius: 1,
              backgroundColor:
                theme.vars?.palette.primary.main ?? theme.palette.primary.main,
            }}
          />
        </Stack>
      </ThemedPanel>
    </Example>
  );
}
render(() => <App />, document.getElementById("root")!);
