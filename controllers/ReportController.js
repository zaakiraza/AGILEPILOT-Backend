import ExportService from "../services/ExportService.js";
import ReportService from "../services/ReportService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class ReportController {
  async create(req, res, next) {
    try {
      const report = await ReportService.createReport(
        req.user,
        req.validated.params.projectId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { report },
        "Progress report created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const reports = await ReportService.listReports(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        { reports },
        "Progress reports fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const report = await ReportService.getReport(
        req.user,
        req.validated.params.projectId,
        req.validated.params.reportId
      );
      return ResponseHandler.success(
        res,
        { report },
        "Progress report fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async export(req, res, next) {
    try {
      const { buffer, filename, contentType } = await ExportService.exportReport(
        req.user,
        req.validated.params.projectId,
        req.validated.params.reportId,
        req.validated.query.format
      );

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
