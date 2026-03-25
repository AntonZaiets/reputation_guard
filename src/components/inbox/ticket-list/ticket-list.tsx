"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {InboxReview} from "@/types/inbox";
import {DraftCard} from "@/components/molecules/draft-card/draft-card";
import {VISION} from "@/lib/vision-ui/colors";
import {
    visionDarkScrollContainerSx,
    visionLightScrollContainerSx,
} from "@/lib/vision-ui/scrollbar-sx";
import {
    visionDashboardCardSx,
    visionDashboardStickyHeaderSurfaceSx,
} from "@/lib/vision-ui/vision-card-sx";
import {
    ticketListAiSummarySx,
    ticketListAnalyzeButtonSx,
    ticketListDetailHeaderSx,
    ticketListDetailRootSx,
    ticketListDetailScrollSx,
    ticketListDrawerPaperSx,
    ticketListEmptyStateTypographySx,
    ticketListRepliesTitleSx,
    ticketListReviewBodySx,
    ticketListRowSx,
    ticketListSectionOverlineSx,
    ticketListSnackbarAlertSx,
    ticketListTableContainerSx,
} from "./ticket-list.styles";
import type {TicketListProps} from "./ticket-list.types";
import {
    formatTicketListDateShort,
    formatTicketListWhen,
    ticketListSnippet,
} from "./ticket-list.utils";
import {useTicketListActions} from "./use-ticket-list-actions";

function avatarHueFromId(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i += 1) h = (h + id.charCodeAt(i) * (i + 1)) % 360;
    return h;
}

function ReviewAuthorCell({
                              row,
                              dark,
                          }: {
    row: InboxReview;
    dark: boolean;
}) {
    const initial = row.source.trim().slice(0, 1).toUpperCase() || "?";
    const hue = avatarHueFromId(row.id);
    const primary = dark ? "#fff" : "text.primary";
    const secondary = dark ? VISION.text.main : "text.secondary";
    const subLine = row.authorId?.trim() || "Anonymous reviewer";

    return (
        <Stack direction="row" alignItems="center" spacing={2} sx={{py: 0.5, pr: 1}}>
            <Avatar
                variant="rounded"
                sx={{
                    width: 40,
                    height: 40,
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    bgcolor: dark ? `hsl(${hue} 42% 32%)` : `hsl(${hue} 35% 42%)`,
                    color: "#fff",
                }}
            >
                {initial}
            </Avatar>
            <Box sx={{minWidth: 0}}>
                <Typography
                    variant="body2"
                    fontWeight={600}
                    color={primary}
                    sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.35,
                    }}
                >
                    {ticketListSnippet(row.content)}
                </Typography>
                <Typography variant="caption" color={secondary} sx={{display: "block", mt: 0.35}}>
                    {row.source}
                    {" · "}
                    {subLine}
                </Typography>
            </Box>
        </Stack>
    );
}

function AnalysisFunctionCell({row, dark}: { row: InboxReview; dark: boolean }) {
    const a = row.analysis;
    const line1 = a?.category ?? "No category";
    const line2 = a ? `Sentiment ${a.sentimentScore}` : "Not analyzed";
    return (
        <Stack spacing={0.35} sx={{py: 0.5}}>
            <Typography
                variant="caption"
                fontWeight={600}
                sx={{color: dark ? "#fff" : undefined}}
            >
                {line1}
                {a?.isCritical ? (
                    <Typography component="span" variant="caption" sx={{color: "error.light", ml: 0.75}}>
                        · Critical
                    </Typography>
                ) : null}
            </Typography>
            <Typography variant="caption" sx={{color: dark ? VISION.text.main : "text.secondary"}}>
                {line2}
            </Typography>
        </Stack>
    );
}

function StatusPill({analyzed, dark}: { analyzed: boolean; dark: boolean }) {
    if (analyzed) {
        return (
            <Box
                component="span"
                sx={{
                    display: "inline-block",
                    px: 1.25,
                    py: 0.45,
                    borderRadius: "10px",
                    bgcolor: VISION.success.main,
                    color: "#fff",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                }}
            >
                Analyzed
            </Box>
        );
    }
    return (
        <Box
            component="span"
            sx={{
                display: "inline-block",
                px: 1.25,
                py: 0.45,
                borderRadius: "10px",
                border: dark ? "1px solid rgba(255,255,255,0.55)" : "1px solid",
                borderColor: dark ? undefined : "divider",
                color: dark ? "#fff" : "text.primary",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
            }}
        >
            Pending
        </Box>
    );
}

const darkHeadCellBase = {
    color: "rgba(255,255,255,0.65)",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 700,
    fontSize: "0.65rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    py: 1.25,
    px: 1.5,
};

const darkCellSx = {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    verticalAlign: "middle" as const,
    py: 1.25,
    px: 1.5,
};

const lightHeadCellBase = {
    color: "text.secondary",
    borderBottom: 2,
    borderColor: "divider",
    fontWeight: 700,
    fontSize: "0.65rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    py: 1.25,
    px: 1.5,
};

const filterTextFieldDarkSx = {
    minWidth: { xs: "100%", sm: 200 },
    flex: { xs: "1 1 100%", sm: "0 0 auto" },
    "& .MuiOutlinedInput-root": {
        color: "#fff",
        fontSize: "0.875rem",
        "& fieldset": { borderColor: "rgba(255,255,255,0.22)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
        "&.Mui-focused fieldset": { borderColor: "rgba(0, 117, 255, 0.75)" },
    },
    "& .MuiInputBase-input::placeholder": {
        color: "rgba(255,255,255,0.45)",
        opacity: 1,
    },
};

const filterFormControlDarkSx = {
    minWidth: { xs: "100%", sm: 132 },
    flex: { xs: "1 1 45%", sm: "0 0 auto" },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.65)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#7ab8ff" },
    "& .MuiOutlinedInput-root": {
        color: "#fff",
        fontSize: "0.875rem",
        "& fieldset": { borderColor: "rgba(255,255,255,0.22)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
        "&.Mui-focused fieldset": { borderColor: "rgba(0, 117, 255, 0.75)" },
    },
    "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
};

const darkFilterMenuProps = {
    PaperProps: {
        sx: {
            mt: 0.75,
            borderRadius: 1.5,
            border: "1px solid rgba(255,255,255,0.12)",
            bgcolor: "rgba(10, 14, 35, 0.98)",
            backdropFilter: "blur(12px)",
            color: "#fff",
            "& .MuiMenuItem-root": {
                color: "rgba(255,255,255,0.9)",
                minHeight: 36,
            },
            "& .MuiMenuItem-root:hover": {
                bgcolor: "rgba(0, 117, 255, 0.18)",
            },
            "& .MuiMenuItem-root.Mui-selected": {
                bgcolor: "rgba(0, 117, 255, 0.26)",
                color: "#fff",
            },
            "& .MuiMenuItem-root.Mui-selected:hover": {
                bgcolor: "rgba(0, 117, 255, 0.34)",
            },
        },
    },
};

const lightCellSx = {
    borderBottom: 1,
    borderColor: "divider",
    verticalAlign: "middle" as const,
    py: 1.25,
    px: 1.5,
};

export function TicketList({reviews, visualVariant = "light"}: TicketListProps) {
    const theme = useTheme();
    const [rows, setRows] = useState<InboxReview[]>(reviews);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filterQuery, setFilterQuery] = useState("");
    const [filterSource, setFilterSource] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<"all" | "analyzed" | "pending">("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    useEffect(() => {
        setRows(reviews);
    }, [reviews]);

    const selected = useMemo(
        () => rows.find((r) => r.id === selectedId) ?? null,
        [rows, selectedId],
    );

    const sourceOptions = useMemo(() => {
        const next = new Set<string>();
        for (const r of rows) {
            const s = r.source.trim();
            if (s.length > 0) next.add(s);
        }
        return [...next].sort((a, b) => a.localeCompare(b));
    }, [rows]);

    const categoryOptions = useMemo(() => {
        const next = new Set<string>();
        for (const r of rows) {
            const c = r.analysis?.category?.trim();
            if (c) next.add(c);
        }
        return [...next].sort((a, b) => a.localeCompare(b));
    }, [rows]);

    useEffect(() => {
        if (filterSource !== "all" && !sourceOptions.includes(filterSource)) {
            setFilterSource("all");
        }
    }, [filterSource, sourceOptions]);

    useEffect(() => {
        if (filterCategory !== "all" && !categoryOptions.includes(filterCategory)) {
            setFilterCategory("all");
        }
    }, [filterCategory, categoryOptions]);

    const filteredRows = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        return rows.filter((row) => {
            if (filterSource !== "all" && row.source.trim() !== filterSource) return false;
            if (filterStatus === "analyzed" && row.analysis == null) return false;
            if (filterStatus === "pending" && row.analysis != null) return false;
            if (filterCategory !== "all") {
                const cat = row.analysis?.category?.trim() ?? "";
                if (cat !== filterCategory) return false;
            }
            if (q.length === 0) return true;
            const blob = [
                row.content,
                row.source,
                row.authorId ?? "",
                row.analysis?.category ?? "",
                row.analysis?.summary ?? "",
            ]
                .join(" ")
                .toLowerCase();
            return blob.includes(q);
        });
    }, [rows, filterQuery, filterSource, filterStatus, filterCategory]);

    const filtersActive =
        filterQuery.trim().length > 0 ||
        filterSource !== "all" ||
        filterStatus !== "all" ||
        filterCategory !== "all";

    const closeDetail = useCallback(() => setSelectedId(null), []);

    const {
        runAnalyze,
        copyText,
        isAnalyzing,
        snackbar,
        dismissSnackbar,
        tooltipDraft,
    } = useTicketListActions(selected, setRows);

    const dark = visualVariant === "dark";
    const headCellSx = useMemo(
        () => ({
            ...(dark ? darkHeadCellBase : lightHeadCellBase),
            ...(dark
                ? visionDashboardStickyHeaderSurfaceSx
                : { backgroundColor: theme.palette.background.paper }),
        }),
        [dark, theme],
    );
    const cellSx = dark ? darkCellSx : lightCellSx;

    const clearFilters = useCallback(() => {
        setFilterQuery("");
        setFilterSource("all");
        setFilterStatus("all");
        setFilterCategory("all");
    }, []);

    const openRow = useCallback((id: string) => {
        setSelectedId(id);
    }, []);

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                maxHeight: dark ? "100%" : undefined,
            }}
        >
            <Paper
                elevation={0}
                sx={
                    dark
                        ? {
                            ...visionDashboardCardSx,
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minHeight: 0,
                            overflow: "hidden",
                            p: 2.75,
                            pt: 2.25,
                        }
                        : {
                            ...ticketListTableContainerSx,
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minHeight: 0,
                            overflow: "hidden",
                            p: 2,
                        }
                }
            >
                <Box
                    sx={{
                        mb: 2.25,
                        display: "flex",
                        flexDirection: { xs: "column", lg: "row" },
                        alignItems: { lg: "flex-start" },
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                            color: dark ? "#fff" : "text.primary",
                            flexShrink: 0,
                        }}
                    >
                        Reviews table
                    </Typography>
                    <Stack
                        direction="row"
                        useFlexGap
                        flexWrap="wrap"
                        spacing={1.25}
                        sx={{
                            alignItems: "center",
                            justifyContent: { xs: "stretch", lg: "flex-end" },
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        <TextField
                            placeholder="Search review, source…"
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            size="small"
                            aria-label="Filter reviews by text"
                            sx={
                                dark
                                    ? filterTextFieldDarkSx
                                    : {
                                          minWidth: { xs: "100%", sm: 200 },
                                          flex: { xs: "1 1 100%", sm: "0 0 auto" },
                                      }
                            }
                        />
                        <FormControl
                            size="small"
                            sx={
                                dark
                                    ? filterFormControlDarkSx
                                    : {
                                          minWidth: 120,
                                          flex: { xs: "1 1 45%", sm: "0 0 auto" },
                                      }
                            }
                        >
                            <InputLabel id="inbox-filter-source">Source</InputLabel>
                            <Select
                                labelId="inbox-filter-source"
                                label="Source"
                                value={filterSource}
                                onChange={(e) => setFilterSource(String(e.target.value))}
                                MenuProps={dark ? darkFilterMenuProps : undefined}
                            >
                                <MenuItem value="all">All sources</MenuItem>
                                {sourceOptions.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        {s}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl
                            size="small"
                            sx={
                                dark
                                    ? filterFormControlDarkSx
                                    : {
                                          minWidth: 120,
                                          flex: { xs: "1 1 45%", sm: "0 0 auto" },
                                      }
                            }
                        >
                            <InputLabel id="inbox-filter-status">Status</InputLabel>
                            <Select
                                labelId="inbox-filter-status"
                                label="Status"
                                value={filterStatus}
                                onChange={(e) =>
                                    setFilterStatus(e.target.value as "all" | "analyzed" | "pending")
                                }
                                MenuProps={dark ? darkFilterMenuProps : undefined}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="analyzed">Analyzed</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl
                            size="small"
                            sx={
                                dark
                                    ? filterFormControlDarkSx
                                    : {
                                          minWidth: 132,
                                          flex: { xs: "1 1 45%", sm: "0 0 auto" },
                                      }
                            }
                        >
                            <InputLabel id="inbox-filter-category">Category</InputLabel>
                            <Select
                                labelId="inbox-filter-category"
                                label="Category"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(String(e.target.value))}
                                disabled={categoryOptions.length === 0}
                                MenuProps={dark ? darkFilterMenuProps : undefined}
                            >
                                <MenuItem value="all">All categories</MenuItem>
                                {categoryOptions.map((c) => (
                                    <MenuItem key={c} value={c}>
                                        {c}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {filtersActive ? (
                            <Button
                                variant="text"
                                size="small"
                                onClick={clearFilters}
                                sx={{
                                    color: dark ? VISION.info.focus : "primary.main",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Clear filters
                            </Button>
                        ) : null}
                    </Stack>
                </Box>
                <TableContainer
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        maxHeight: {
                            xs: "calc(100dvh - 220px)",
                            sm: "calc(100dvh - 200px)",
                            md: "calc(100dvh - 180px)",
                        },
                        overflow: "auto",
                        WebkitOverflowScrolling: "touch",
                        mx: dark ? -2.75 : -2,
                        mb: dark ? -2.75 : -2,
                        px: dark ? 2.75 : 2,
                        ...(dark ? visionDarkScrollContainerSx : visionLightScrollContainerSx),
                    }}
                >
                    <Table
                        stickyHeader
                        size="small"
                        sx={{
                            tableLayout: "fixed",
                            width: "100%",
                            minWidth: 720,
                            color: 'inherit'
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...headCellSx, width: "36%" }}>Review</TableCell>
                                <TableCell sx={{ ...headCellSx, width: "24%" }}>Analysis</TableCell>
                                <TableCell sx={{ ...headCellSx, width: "14%", textAlign: "center" }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ ...headCellSx, width: "14%", textAlign: "center" }}>
                                    Received
                                </TableCell>
                                <TableCell sx={{ ...headCellSx, width: "12%", textAlign: "center" }}>
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={cellSx}>
                                        <Typography
                                            color={dark ? undefined : "text.secondary"}
                                            sx={{
                                                ...ticketListEmptyStateTypographySx,
                                                ...(dark ? { color: "rgba(255,255,255,0.6)" } : {}),
                                            }}
                                            align="center"
                                        >
                                            No tickets yet. POST reviews to{" "}
                                            <Typography component="span" variant="body2" fontFamily="monospace">
                                                /api/reviews
                                            </Typography>{" "}
                                            to populate the inbox.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={cellSx}>
                                        <Typography
                                            color={dark ? undefined : "text.secondary"}
                                            sx={{
                                                ...ticketListEmptyStateTypographySx,
                                                ...(dark ? { color: "rgba(255,255,255,0.6)" } : {}),
                                            }}
                                            align="center"
                                        >
                                            No reviews match your filters.{" "}
                                            <Link
                                                component="button"
                                                type="button"
                                                variant="body2"
                                                onClick={clearFilters}
                                                sx={{
                                                    verticalAlign: "baseline",
                                                    fontWeight: 600,
                                                    color: dark ? VISION.info.focus : "primary.main",
                                                }}
                                            >
                                                Clear filters
                                            </Link>
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        onClick={() => openRow(row.id)}
                                        sx={{
                                            ...ticketListRowSx,
                                            cursor: "pointer",
                                            ...(dark
                                                ? {"&:hover": {bgcolor: "rgba(255,255,255,0.04)"}}
                                                : {"&:hover": {bgcolor: "action.hover"}}),
                                        }}
                                    >
                                        <TableCell sx={cellSx}>
                                            <ReviewAuthorCell row={row} dark={dark}/>
                                        </TableCell>
                                        <TableCell sx={cellSx}>
                                            <AnalysisFunctionCell row={row} dark={dark}/>
                                        </TableCell>
                                        <TableCell sx={{...cellSx, textAlign: "center"}}>
                                            <StatusPill analyzed={row.analysis != null} dark={dark}/>
                                        </TableCell>
                                        <TableCell sx={{...cellSx, textAlign: "center"}}>
                                            <Typography
                                                variant="caption"
                                                fontWeight={600}
                                                sx={{color: dark ? "#fff" : "text.primary"}}
                                            >
                                                {formatTicketListDateShort(row.createdAt)}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                component="div"
                                                sx={{
                                                    display: "block",
                                                    mt: 0.25,
                                                    color: dark ? VISION.text.main : "text.secondary",
                                                    fontSize: "0.65rem",
                                                }}
                                            >
                                                {formatTicketListWhen(row.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{...cellSx, textAlign: "center"}}>
                                            <Link
                                                component="button"
                                                type="button"
                                                variant="caption"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openRow(row.id);
                                                }}
                                                sx={{
                                                    fontWeight: 600,
                                                    color: dark ? VISION.text.main : "text.secondary",
                                                    textDecoration: "none",
                                                    cursor: "pointer",
                                                    border: 0,
                                                    background: "none",
                                                    "&:hover": {color: dark ? "#fff" : "primary.main"},
                                                }}
                                            >
                                                Open
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Drawer
                anchor="right"
                open={selected != null}
                onClose={closeDetail}
                slotProps={{
                    paper: {
                        sx: ticketListDrawerPaperSx,
                    },
                }}
            >
                {selected ? (
                    <Box sx={ticketListDetailRootSx}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={ticketListDetailHeaderSx}
                        >
                            <Typography variant="h6" component="h2" fontWeight={600}>
                                Reply builder
                            </Typography>
                            <IconButton edge="end" onClick={closeDetail} aria-label="close">
                                <CloseIcon/>
                            </IconButton>
                        </Stack>

                        <Box sx={ticketListDetailScrollSx}>
                            <Typography variant="overline" color="text.secondary">
                                Original review
                            </Typography>
                            <Typography variant="body1" sx={ticketListReviewBodySx}>
                                {selected.content}
                            </Typography>
                            <Stack direction="row" gap={1} flexWrap="wrap" sx={{mt: 1.5}}>
                                <Chip size="small" label={selected.source} variant="outlined"/>
                                <Chip
                                    size="small"
                                    label={formatTicketListWhen(selected.createdAt)}
                                    variant="outlined"
                                />
                            </Stack>

                            <Typography variant="overline" color="text.secondary" sx={ticketListSectionOverlineSx}>
                                AI summary
                            </Typography>
                            <Typography variant="body2" sx={ticketListAiSummarySx}>
                                {selected.analysis?.summary ??
                                    "Run analysis to generate a summary and reply drafts."}
                            </Typography>

                            <Typography variant="h6" sx={ticketListRepliesTitleSx} fontWeight={600}>
                                AI suggested replies
                            </Typography>

                            {!selected.analysis ? (
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={isAnalyzing}
                                    onClick={() => void runAnalyze()}
                                    startIcon={
                                        isAnalyzing ? (
                                            <CircularProgress size={22} color="inherit" aria-label="Analyzing"/>
                                        ) : (
                                            <AutoAwesomeIcon/>
                                        )
                                    }
                                    sx={ticketListAnalyzeButtonSx}
                                >
                                    {isAnalyzing ? "Analyzing…" : "Ask AI to Analyze & Reply"}
                                </Button>
                            ) : (
                                <Stack spacing={2}>
                                    <DraftCard
                                        title="Empathetic"
                                        subtitle="Apologies and understanding"
                                        text={selected.analysis.draftEmpathetic}
                                        copyKey="empathetic"
                                        tooltipDraft={tooltipDraft}
                                        onCopy={copyText}
                                    />
                                    <DraftCard
                                        title="Official"
                                        subtitle="Professional and concise"
                                        text={selected.analysis.draftOfficial}
                                        copyKey="official"
                                        tooltipDraft={tooltipDraft}
                                        onCopy={copyText}
                                    />
                                    <DraftCard
                                        title="Action-oriented"
                                        subtitle="Troubleshooting and next steps"
                                        text={selected.analysis.draftAction}
                                        copyKey="action"
                                        tooltipDraft={tooltipDraft}
                                        onCopy={copyText}
                                    />
                                </Stack>
                            )}
                        </Box>
                    </Box>
                ) : null}
            </Drawer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2200}
                onClose={dismissSnackbar}
                anchorOrigin={{vertical: "bottom", horizontal: "center"}}
            >
                <Alert
                    onClose={dismissSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={ticketListSnackbarAlertSx}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
