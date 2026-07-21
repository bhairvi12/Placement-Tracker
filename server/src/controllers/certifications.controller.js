import Certification from '../models/Certification.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';

/**
 * Get all certifications of logged in user
 */
export const getCertifications = async (req, res, next) => {
  try {
    const certs = await Certification.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: 'Certifications retrieved successfully',
      data: certs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new certification
 */
export const createCertification = async (req, res, next) => {
  try {
    const { name, platform, status, progressPercent, completedDate } = req.body;

    const cert = await Certification.create({
      userId: req.user._id,
      name,
      platform,
      status,
      progressPercent,
      completedDate,
    });

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'CERTIFICATION_CREATE',
      description: `Added certification: ${name}`,
    });

    res.status(201).json({
      success: true,
      message: 'Certification created successfully',
      data: cert,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing certification with ownership validation
 */
export const updateCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, platform, status, progressPercent, completedDate } = req.body;

    const cert = await Certification.findById(id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found.',
      });
    }

    // Ownership check
    if (cert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this certification.',
      });
    }

    // Update fields
    if (name !== undefined) cert.name = name;
    if (platform !== undefined) cert.platform = platform;
    if (status !== undefined) cert.status = status;
    if (progressPercent !== undefined) cert.progressPercent = progressPercent;
    if (completedDate !== undefined) cert.completedDate = completedDate;

    await cert.save();

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'CERTIFICATION_UPDATE',
      description: `Updated certification: ${cert.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'Certification updated successfully',
      data: cert,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a certification with ownership validation
 */
export const deleteCertification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cert = await Certification.findById(id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found.',
      });
    }

    // Ownership check
    if (cert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this certification.',
      });
    }

    const certName = cert.name;
    await Certification.findByIdAndDelete(id);

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'CERTIFICATION_DELETE',
      description: `Deleted certification: ${certName}`,
    });

    res.status(200).json({
      success: true,
      message: 'Certification deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
