import React from 'react';
import { useParty, useStreamQueries } from '@c7/react';
import { MatchedTrade } from '@daml.js/canton-dark-pool-0.1.0/lib/DarkPool/Trade';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { green, red } from '@mui/material/colors';

// Helper to parse the display name from a Party ID string (e.g., "Alice::1220...")
const getPartyName = (partyId: string): string => {
  return partyId.split('::')[0];
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  '&.MuiTableCell-body': {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const SideCell = styled(TableCell)<{ side: 'Buy' | 'Sell' }>(({ side }) => ({
  color: side === 'Buy' ? green[600] : red[600],
  fontWeight: 'bold',
}));

export const OrderBlotter: React.FC = () => {
  const { party } = useParty();
  const { contracts: matchedTrades, loading } = useStreamQueries(MatchedTrade);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
        <Typography ml={2}>Loading Matched Trades...</Typography>
      </Box>
    );
  }

  const sortedTrades = [...matchedTrades].sort(
    (a, b) => new Date(b.payload.tradeTime).getTime() - new Date(a.payload.tradeTime).getTime()
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
      <Box p={2}>
        <Typography variant="h5" component="h2" gutterBottom>
          Trade Blotter
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="matched trades blotter">
          <TableHead>
            <TableRow>
              <StyledTableCell>Trade Time</StyledTableCell>
              <StyledTableCell>Instrument</StyledTableCell>
              <StyledTableCell align="center">Side</StyledTableCell>
              <StyledTableCell align="right">Quantity</StyledTableCell>
              <StyledTableCell align="right">Price</StyledTableCell>
              <StyledTableCell align="right">Consideration</StyledTableCell>
              <StyledTableCell>Counterparty</StyledTableCell>
              <StyledTableCell>Trade ID</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography p={4} color="text.secondary">
                    No matched trades to display.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedTrades.map(({ contractId, payload }) => {
                const isBuySide = payload.buyer === party;
                const side = isBuySide ? 'Buy' : 'Sell';
                const counterparty = isBuySide ? payload.seller : payload.buyer;
                const quantity = parseFloat(payload.quantity);
                const price = parseFloat(payload.price);
                const consideration = quantity * price;

                return (
                  <StyledTableRow key={contractId}>
                    <TableCell>
                      {new Date(payload.tradeTime).toLocaleString()}
                    </TableCell>
                    <TableCell>{payload.ticker}</TableCell>
                    <SideCell side={side} align="center">{side}</SideCell>
                    <TableCell align="right">{quantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{price.toFixed(4)}</TableCell>
                    <TableCell align="right">{consideration.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{getPartyName(counterparty)}</TableCell>
                    <TableCell>
                      <Tooltip title={contractId} placement="top">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', cursor: 'pointer' }}>
                          {`...${contractId.substring(contractId.length - 8)}`}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </StyledTableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default OrderBlotter;