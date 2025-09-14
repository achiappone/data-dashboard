import { Box, Paper, Stack, Typography } from "@mui/material";

const fmt = (v: number) => v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

type Props = {
  total: number;
  monthlyAvg: number;
  topCategory: string | null;
};

export function KPI({ total, monthlyAvg, topCategory }: Props) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      <Paper sx={{ p: 2 }}>
        <Stack>
          <Typography variant="caption">Total Amount</Typography>
          <Typography variant="h6">{fmt(total)}</Typography>
        </Stack>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Stack>
          <Typography variant="caption">Monthly Average</Typography>
          <Typography variant="h6">{fmt(monthlyAvg)}</Typography>
        </Stack>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Stack>
          <Typography variant="caption">Top Category</Typography>
          <Typography variant="h6">{topCategory ?? "N/A"}</Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
