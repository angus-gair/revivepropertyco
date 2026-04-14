/**
 * Customer Documents API Routes
 * Handles file upload, download, list, and delete operations for customer documents
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');

const router = express.Router();

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'customers');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

// Ensure upload directory exists
const ensureUploadDir = (customerId) => {
  const customerDir = path.join(UPLOAD_DIR, customerId);
  if (!fs.existsSync(customerDir)) {
    fs.mkdirSync(customerDir, { recursive: true, mode: 0o755 });
  }
  return customerDir;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const customerId = req.user.userId;
    const customerDir = ensureUploadDir(customerId);
    cb(null, customerDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and add timestamp prefix
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const filename = `${timestamp}_${baseName}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX'), false);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Invalid file extension. Allowed: .pdf, .jpg, .jpeg, .png, .doc, .docx'), false);
    }

    cb(null, true);
  }
});

/**
 * POST /api/customer/documents
 * Upload a document
 */
router.post('/documents', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const customerId = req.user.userId;
    const file = req.file;
    const { description } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Save document metadata to database
    const result = await query(
      `INSERT INTO customer_documents (customer_id, filename, original_filename, file_path, file_size, mime_type, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING document_id, customer_id, filename, original_filename, file_path, file_size, mime_type, description, uploaded_at`,
      [
        customerId,
        file.filename,
        file.originalname,
        path.join('customers', customerId, file.filename),
        file.size,
        file.mimetype,
        description || null
      ]
    );

    const document = result.rows[0];

    // Log upload
    await query(
      `INSERT INTO audit_log (customer_id, action, details)
       VALUES ($1, 'DOCUMENT_UPLOAD', $2)`,
      [customerId, JSON.stringify({ filename: file.originalname, size: file.size })]
    );

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        documentId: document.document_id,
        filename: document.filename,
        originalFilename: document.original_filename,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        description: document.description,
        uploadedAt: document.uploaded_at
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);

    // Clean up uploaded file if database insert failed
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to clean up file:', err);
      });
    }

    res.status(500).json({
      success: false,
      error: 'An error occurred while uploading the document'
    });
  }
});

/**
 * GET /api/customer/documents
 * List all documents for the authenticated customer
 */
router.get('/documents', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;

    const result = await query(
      `SELECT document_id, customer_id, filename, original_filename, file_size, mime_type, description, uploaded_at
       FROM customer_documents
       WHERE customer_id = $1
       ORDER BY uploaded_at DESC`,
      [customerId]
    );

    res.json({
      success: true,
      documents: result.rows.map(doc => ({
        documentId: doc.document_id,
        filename: doc.filename,
        originalFilename: doc.original_filename,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        description: doc.description,
        uploadedAt: doc.uploaded_at
      }))
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching documents'
    });
  }
});

/**
 * GET /api/customer/documents/:id
 * Download a specific document
 */
router.get('/documents/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;
    const documentId = req.params.id;

    // Get document metadata and verify ownership
    const result = await query(
      `SELECT document_id, customer_id, filename, original_filename, file_path, mime_type
       FROM customer_documents
       WHERE document_id = $1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = result.rows[0];

    // Verify ownership
    if (document.customer_id !== customerId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this document'
      });
    }

    const filePath = path.join(UPLOAD_DIR, document.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }

    // Send file
    res.download(filePath, document.original_filename, (err) => {
      if (err) {
        console.error('File download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'An error occurred while downloading the file'
          });
        }
      }
    });
  } catch (error) {
    console.error('Download document error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'An error occurred while downloading the document'
      });
    }
  }
});

/**
 * DELETE /api/customer/documents/:id
 * Delete a specific document
 */
router.delete('/documents/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;
    const documentId = req.params.id;

    // Get document metadata and verify ownership
    const result = await query(
      `SELECT document_id, customer_id, filename, file_path
       FROM customer_documents
       WHERE document_id = $1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = result.rows[0];

    // Verify ownership
    if (document.customer_id !== customerId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this document'
      });
    }

    const filePath = path.join(UPLOAD_DIR, document.file_path);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await query(
      'DELETE FROM customer_documents WHERE document_id = $1',
      [documentId]
    );

    // Log deletion
    await query(
      `INSERT INTO audit_log (customer_id, action, details)
       VALUES ($1, 'DOCUMENT_DELETE', $2)`,
      [customerId, JSON.stringify({ filename: document.filename })]
    );

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting the document'
    });
  }
});

module.exports = router;
