import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@careos/database'
import { requireAdminAuth } from '../middleware/require-admin-auth'

export const adminLabsRouter = Router()

adminLabsRouter.use(requireAdminAuth)

const listQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
})

adminLabsRouter.get('/lab-orders', async (req, res) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid lab order query.',
        errors: parsed.error.flatten(),
      })
    }

    const { status, limit } = parsed.data

    const labOrders = status
      ? await prisma.$queryRaw<any[]>`
          SELECT
            to_jsonb(lo) AS "rawOrder",
            lo.id,
            lo.status,
            lo.created_at AS "createdAt",
            lo.updated_at AS "updatedAt",

            json_build_object(
              'id', p.id,
              'fullName', p.full_name,
              'user', json_build_object(
                'id', u.id,
                'email', u.email,
                'phone', u.phone,
                'status', u.status
              )
            ) AS patient,

            json_build_object(
              'id', l.id,
              'name', l.name
            ) AS lab,

            CASE
              WHEN h.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', h.id,
                'name', h.name,
                'legalName', h.legal_name
              )
            END AS hospital,

            CASE
              WHEN d.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', d.id,
                'fullName', d.full_name,
                'specialization', d.specialization
              )
            END AS "orderingDoctor",

            COALESCE(
              (
                SELECT json_agg(to_jsonb(loi))
                FROM lab_order_items loi
                WHERE loi.lab_order_id = lo.id
              ),
              '[]'::json
            ) AS items,

            COALESCE(
              (
                SELECT json_agg(to_jsonb(lr))
                FROM lab_reports lr
                WHERE lr.lab_order_id = lo.id
              ),
              '[]'::json
            ) AS reports

          FROM lab_orders lo
          JOIN patients p ON p.id = lo.patient_id
          JOIN users u ON u.id = p.user_id
          JOIN labs l ON l.id = lo.lab_id
          LEFT JOIN hospitals h ON h.id = lo.hospital_id
          LEFT JOIN doctors d ON d.id = lo.doctor_id

          WHERE lo.deleted_at IS NULL
            AND lo.status = ${status}

          ORDER BY lo.created_at DESC
          LIMIT ${limit}
        `
      : await prisma.$queryRaw<any[]>`
          SELECT
            to_jsonb(lo) AS "rawOrder",
            lo.id,
            lo.status,
            lo.created_at AS "createdAt",
            lo.updated_at AS "updatedAt",

            json_build_object(
              'id', p.id,
              'fullName', p.full_name,
              'user', json_build_object(
                'id', u.id,
                'email', u.email,
                'phone', u.phone,
                'status', u.status
              )
            ) AS patient,

            json_build_object(
              'id', l.id,
              'name', l.name
            ) AS lab,

            CASE
              WHEN h.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', h.id,
                'name', h.name,
                'legalName', h.legal_name
              )
            END AS hospital,

            CASE
              WHEN d.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', d.id,
                'fullName', d.full_name,
                'specialization', d.specialization
              )
            END AS "orderingDoctor",

            COALESCE(
              (
                SELECT json_agg(to_jsonb(loi))
                FROM lab_order_items loi
                WHERE loi.lab_order_id = lo.id
              ),
              '[]'::json
            ) AS items,

            COALESCE(
              (
                SELECT json_agg(to_jsonb(lr))
                FROM lab_reports lr
                WHERE lr.lab_order_id = lo.id
              ),
              '[]'::json
            ) AS reports

          FROM lab_orders lo
          JOIN patients p ON p.id = lo.patient_id
          JOIN users u ON u.id = p.user_id
          JOIN labs l ON l.id = lo.lab_id
          LEFT JOIN hospitals h ON h.id = lo.hospital_id
          LEFT JOIN doctors d ON d.id = lo.doctor_id

          WHERE lo.deleted_at IS NULL

          ORDER BY lo.created_at DESC
          LIMIT ${limit}
        `

    return res.json({
      labOrders,
    })
  } catch (error) {
    console.error('Admin list lab orders error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminLabsRouter.get('/lab-orders/:id', async (req, res) => {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        to_jsonb(lo) AS "rawOrder",
        lo.id,
        lo.status,
        lo.created_at AS "createdAt",
        lo.updated_at AS "updatedAt",

        json_build_object(
          'id', p.id,
          'fullName', p.full_name,
          'dateOfBirth', p.date_of_birth,
          'gender', p.gender,
          'phone', p.phone,
          'user', json_build_object(
            'id', u.id,
            'email', u.email,
            'phone', u.phone,
            'status', u.status
          )
        ) AS patient,

        json_build_object(
          'id', l.id,
          'name', l.name
        ) AS lab,

        CASE
          WHEN h.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', h.id,
            'name', h.name,
            'legalName', h.legal_name,
            'contactEmail', h.contact_email,
            'contactPhone', h.contact_phone
          )
        END AS hospital,

        CASE
          WHEN d.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', d.id,
            'fullName', d.full_name,
            'specialization', d.specialization,
            'licenseNumber', d.license_number
          )
        END AS "orderingDoctor",

        COALESCE(
          (
            SELECT json_agg(to_jsonb(loi))
            FROM lab_order_items loi
            WHERE loi.lab_order_id = lo.id
          ),
          '[]'::json
        ) AS items,

        COALESCE(
          (
            SELECT json_agg(to_jsonb(lr))
            FROM lab_reports lr
            WHERE lr.lab_order_id = lo.id
          ),
          '[]'::json
        ) AS reports

      FROM lab_orders lo
      JOIN patients p ON p.id = lo.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN labs l ON l.id = lo.lab_id
      LEFT JOIN hospitals h ON h.id = lo.hospital_id
      LEFT JOIN doctors d ON d.id = lo.doctor_id

      WHERE lo.id = ${req.params.id}
        AND lo.deleted_at IS NULL

      LIMIT 1
    `

    const labOrder = rows[0]

    if (!labOrder) {
      return res.status(404).json({
        message: 'Lab order not found.',
      })
    }

    return res.json({
      labOrder,
    })
  } catch (error) {
    console.error('Admin get lab order error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminLabsRouter.get('/lab-reports', async (req, res) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid lab report query.',
        errors: parsed.error.flatten(),
      })
    }

    const { limit } = parsed.data

    const labReports = await prisma.$queryRaw<any[]>`
      SELECT
        to_jsonb(lr) AS "rawReport",
        lr.id,
        lr.created_at AS "createdAt",

        json_build_object(
          'id', lo.id,
          'status', lo.status,
          'createdAt', lo.created_at
        ) AS "labOrder",

        json_build_object(
          'id', p.id,
          'fullName', p.full_name,
          'user', json_build_object(
            'id', u.id,
            'email', u.email,
            'phone', u.phone,
            'status', u.status
          )
        ) AS patient,

        json_build_object(
          'id', l.id,
          'name', l.name
        ) AS lab,

        CASE
          WHEN h.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', h.id,
            'name', h.name,
            'legalName', h.legal_name
          )
        END AS hospital,

        CASE
          WHEN d.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', d.id,
            'fullName', d.full_name,
            'specialization', d.specialization
          )
        END AS "orderingDoctor"

      FROM lab_reports lr
      JOIN lab_orders lo ON lo.id = lr.lab_order_id
      JOIN patients p ON p.id = lo.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN labs l ON l.id = lo.lab_id
      LEFT JOIN hospitals h ON h.id = lo.hospital_id
      LEFT JOIN doctors d ON d.id = lo.doctor_id

      WHERE lo.deleted_at IS NULL

      ORDER BY lr.created_at DESC
      LIMIT ${limit}
    `

    return res.json({
      labReports,
    })
  } catch (error) {
    console.error('Admin list lab reports error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminLabsRouter.get('/lab-reports/:id', async (req, res) => {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        to_jsonb(lr) AS "rawReport",
        lr.id,
        lr.created_at AS "createdAt",

        json_build_object(
          'id', lo.id,
          'status', lo.status,
          'createdAt', lo.created_at
        ) AS "labOrder",

        json_build_object(
          'id', p.id,
          'fullName', p.full_name,
          'dateOfBirth', p.date_of_birth,
          'gender', p.gender,
          'phone', p.phone,
          'user', json_build_object(
            'id', u.id,
            'email', u.email,
            'phone', u.phone,
            'status', u.status
          )
        ) AS patient,

        json_build_object(
          'id', l.id,
          'name', l.name
        ) AS lab,

        CASE
          WHEN h.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', h.id,
            'name', h.name,
            'legalName', h.legal_name,
            'contactEmail', h.contact_email,
            'contactPhone', h.contact_phone
          )
        END AS hospital,

        CASE
          WHEN d.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', d.id,
            'fullName', d.full_name,
            'specialization', d.specialization,
            'licenseNumber', d.license_number
          )
        END AS "orderingDoctor"

      FROM lab_reports lr
      JOIN lab_orders lo ON lo.id = lr.lab_order_id
      JOIN patients p ON p.id = lo.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN labs l ON l.id = lo.lab_id
      LEFT JOIN hospitals h ON h.id = lo.hospital_id
      LEFT JOIN doctors d ON d.id = lo.doctor_id

      WHERE lr.id = ${req.params.id}
        AND lo.deleted_at IS NULL

      LIMIT 1
    `

    const labReport = rows[0]

    if (!labReport) {
      return res.status(404).json({
        message: 'Lab report not found.',
      })
    }

    return res.json({
      labReport,
    })
  } catch (error) {
    console.error('Admin get lab report error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})
