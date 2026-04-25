import { ok } from '../utils/response.js';
import { getDashboardData } from '../services/dashboardService.js';

export async function getDashboard(req, res) {
  return ok(res, await getDashboardData(req.user.id));
}
