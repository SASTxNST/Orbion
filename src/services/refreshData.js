import axios from "axios";
import cron from "node-cron";
import { Satellite } from "../models/sattelite.model.js";
import { Group } from "../models/group.model.js";

async function updateSatellites() {
  try {
    const groups = await Group.find({}, "name").lean();
    if (!groups.length) return;

    for (const { name: groupName } of groups) {
      try {
        const [jsonRes, tleRes] = await Promise.all([
          axios.get(
            `https://celestrak.org/NORAD/elements/gp.php?GROUP=${groupName}&FORMAT=json`,
            { timeout: 30000 }
          ),
          axios.get(
            `https://celestrak.org/NORAD/elements/gp.php?GROUP=${groupName}&FORMAT=tle`,
            { timeout: 30000, responseType: "text" }
          ),
        ]);

        const tleLines = tleRes.data.split("\n").filter(Boolean);
        const tleMap = {};

        for (let i = 0; i < tleLines.length; i += 3) {
          tleMap[tleLines[i].trim()] = {
            tle_line1: tleLines[i + 1]?.trim() || "",
            tle_line2: tleLines[i + 2]?.trim() || "",
          };
        }

        const satellites = jsonRes.data.map((sat) => ({
          ...sat,
          ...tleMap[sat.OBJECT_NAME],
          group: groupName,
        }));

        if (!satellites.length) continue;

        const bulkOps = satellites.map((sat) => ({
          updateOne: {
            filter: { name: sat.OBJECT_NAME },
            update: {
              $set: {
                name: sat.OBJECT_NAME,
                objectId: sat.OBJECT_ID,
                epoch: sat.EPOCH,
                meanMotion: sat.MEAN_MOTION,
                eccentricity: sat.ECCENTRICITY,
                inclination: sat.INCLINATION,
                raOfAscNode: sat.RA_OF_ASC_NODE,
                argOfPericenter: sat.ARG_OF_PERICENTER,
                meanAnomaly: sat.MEAN_ANOMALY,
                ephemerisType: sat.EPHEMERIS_TYPE,
                classificationType: sat.CLASSIFICATION_TYPE,
                noradCatId: sat.NORAD_CAT_ID,
                elementSetNo: sat.ELEMENT_SET_NO,
                revAtEpoch: sat.REV_AT_EPOCH,
                bstar: sat.BSTAR,
                meanMotionDot: sat.MEAN_MOTION_DOT,
                meanMotionDdot: sat.MEAN_MOTION_DDOT,
                tle_line1: sat.tle_line1,
                tle_line2: sat.tle_line2,
                group: sat.group,
                lastUpdated: new Date(),
              },
            },
            upsert: true,
          },
        }));

        await Satellite.bulkWrite(bulkOps, { ordered: false });

        const satDocs = await Satellite.find(
          { name: { $in: satellites.map((s) => s.OBJECT_NAME) } },
          "_id"
        );

        await Group.updateOne(
          { name: groupName },
          { $addToSet: { satellites: { $each: satDocs.map((s) => s._id) } } }
        );

        console.log(`Updated group: ${groupName}`);
      } catch (err) {
        console.error(`Failed to update group ${groupName}:`, err.message);
      }
    }
  } catch (error) {
    console.error("Satellite update failed:", error.message);
  }
}

cron.schedule("0 0 * * *", updateSatellites);

export default updateSatellites;
