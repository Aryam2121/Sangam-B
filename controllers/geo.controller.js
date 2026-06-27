import { GeoLayer } from "../models/geoLayer.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";
import { Path } from "../models/totalpath.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ADMIN_ROLES } from "../utils/roles.js";

const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };

const buildGeoFilter = (query = {}) => {
  const filter = {};
  if (query.zone) filter.zone = String(query.zone);
  if (query.ward) filter.ward = String(query.ward);
  if (query.district) filter.district = String(query.district);
  return filter;
};

const firstPathPoint = (pathDoc) => {
  const point = pathDoc?.totalpath?.[0]?.points?.[0];
  if (point?.lat != null && point?.lng != null) return { lat: point.lat, lng: point.lng };
  return null;
};

const enrichProjectsWithLocations = async (projects = []) => {
  if (!projects.length) return [];

  const missingIds = projects
    .filter((p) => !p.location?.lat || !p.location?.lng)
    .map((p) => p._id);

  const paths = missingIds.length
    ? await Path.find({ _id: { $in: missingIds } }).select("totalpath").lean()
    : [];

  const pathMap = paths.reduce((acc, row) => {
    acc[String(row._id)] = firstPathPoint(row);
    return acc;
  }, {});

  return projects.map((project, index) => {
    const row = project.toObject ? project.toObject() : { ...project };
    if (row.location?.lat && row.location?.lng) return row;

    const fromPath = pathMap[String(row._id)];
    const fallback = {
      lat: DELHI_CENTER.lat + (index % 8) * 0.012,
      lng: DELHI_CENTER.lng + (index % 6) * 0.015,
    };

    return {
      ...row,
      location: fromPath || fallback,
      locationSource: fromPath ? "path" : "fallback",
    };
  });
};

export const getMapHubData = asyncHandler(async (req, res) => {
  const geoFilter = buildGeoFilter(req.query);

  const [projectRows, layers, conflictTasks] = await Promise.all([
    Project.find(geoFilter)
      .select("name status location zone ward district budgetAllocated budgetSpent")
      .limit(200)
      .lean(),
    GeoLayer.find({ visible: true }).sort({ createdAt: -1 }).limit(20).lean(),
    Task.find({
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    })
      .populate("project", "name location zone ward")
      .limit(30)
      .select("title status dueDate department project")
      .lean(),
  ]);

  const projects = await enrichProjectsWithLocations(projectRows);

  res.status(200).json({
    success: true,
    projects,
    layers,
    conflictHotspots: conflictTasks,
    filters: geoFilter,
    stats: {
      totalProjects: projects.length,
      withStoredLocation: projectRows.filter((p) => p.location?.lat).length,
      mappedProjects: projects.length,
    },
  });
});

export const syncProjectLocations = asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  const projects = await Project.find().select("_id location zone ward district").limit(500);
  const paths = await Path.find({ _id: { $in: projects.map((p) => p._id) } });
  const pathMap = paths.reduce((acc, row) => {
    acc[String(row._id)] = row;
    return acc;
  }, {});

  let updated = 0;
  for (let i = 0; i < projects.length; i += 1) {
    const project = projects[i];
    if (project.location?.lat && project.location?.lng) continue;

    const point = firstPathPoint(pathMap[String(project._id)]);
    const patch = point
      ? { location: point }
      : {
          location: {
            lat: DELHI_CENTER.lat + (i % 8) * 0.012,
            lng: DELHI_CENTER.lng + (i % 6) * 0.015,
          },
          zone: project.zone || "Central",
          ward: project.ward || `Ward ${(i % 12) + 1}`,
          district: project.district || "New Delhi",
        };

    await Project.findByIdAndUpdate(project._id, patch);
    updated += 1;
  }

  res.status(200).json({ success: true, updated, total: projects.length });
});

export const uploadGeoLayer = asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  const { name, layerType, geojson } = req.body;
  if (!name?.trim() || !geojson) {
    return res.status(400).json({ success: false, message: "Name and geojson are required" });
  }

  let parsed = geojson;
  if (typeof geojson === "string") {
    try {
      parsed = JSON.parse(geojson);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid GeoJSON" });
    }
  }

  const layer = await GeoLayer.create({
    name: name.trim(),
    layerType: layerType || "custom",
    geojson: parsed,
    uploadedBy: req.user._id,
    uploadedByName: req.user.fullName || req.user.username,
  });

  res.status(201).json({ success: true, layer });
});

export const getGeoLayers = asyncHandler(async (req, res) => {
  const layers = await GeoLayer.find().sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, layers });
});

export const deleteGeoLayer = asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  await GeoLayer.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Layer deleted" });
});

export const updateProjectLocation = asyncHandler(async (req, res) => {
  const { lat, lng, zone, ward, district } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.projectId,
    {
      location: { lat: Number(lat), lng: Number(lng) },
      ...(zone && { zone }),
      ...(ward && { ward }),
      ...(district && { district }),
    },
    { new: true }
  );

  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found" });
  }

  res.status(200).json({ success: true, project });
});
