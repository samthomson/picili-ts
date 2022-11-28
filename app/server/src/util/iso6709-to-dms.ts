import dms2dec from 'dms2dec'

/*
taken from https://github.com/Kahn/iso6709-to-dms/ directly instead of using
the package, as that proved problematic: https://github.com/Kahn/iso6709-to-dms/issues/1
also modified as per https://github.com/Kahn/iso6709-to-dms/pull/3 so that altitude parsing
works.
*/

// https://github.com/vatSys/xml-tools/blob/master/DotAIPtoXML/DotAIPtoXML/Coordinate.cs#L119
// Latitude and Longitude in Degrees:
//     ±DD.DDDD±DDD.DDDD         (eg +12.345-098.765)
const latlngd = new RegExp(/(?<latRef>[+-])(?<latD>[0-9]{2}\.[0-9]+)(?<lonRef>[+-])(?<lonD>[0-9]{3}\.[0-9]+)/)
// Latitude and Longitude in Degrees and Minutes:
//     ±DDMM.MMMM±DDDMM.MMMM     (eg +1234.56-09854.321)
const latlngdm = new RegExp(
    /(?<latRef>[+-])(?<latD>[0-9]{2})(?<latM>[0-9]{2}\.[0-9]+)(?<lonRef>[+-])(?<lonD>[0-9]{3})(?<lonM>[0-9]{2}\.[0-9]+)/,
)
// Latitude and Longitude in Degrees, Minutes and Seconds:
//     ±DDMMSS.SSSS±DDDMMSS.SSSS (eg +123456.7-0985432.1)
const latlngdms = new RegExp(
    /(?<latRef>[+-])(?<latD>[0-9]{2})(?<latM>[0-9]{2})(?<latS>[0-9]{2}\.[0-9]+)(?<lonRef>[+-])(?<lonD>[0-9]{3})(?<lonM>[0-9]{2})(?<lonS>[0-9]{2}\.[0-9]+)/,
)
// Latitude, Longitude (in Degrees) and Altitude:
//     ±DD.DDDD±DDD.DDDD±AAA.AAA         (eg +12.345-098.765+15.9)
const latlngdalt = new RegExp(
    /(?<latRef>[+-])(?<latD>[0-9]{2}\.[0-9]+)(?<lonRef>[+-])(?<lonD>[0-9]{3}\.[0-9]+)(?<altitude>[+-][0-9]{1,4}\.[0-9]+)/,
)
// Latitude, Longitude (in Degrees and Minutes) and Altitude:
//     ±DDMM.MMMM±DDDMM.MMMM±AAA.AAA     (eg +1234.56-09854.321+15.9)
const latlngdmalt = new RegExp(
    /(?<latRef>[+-])(?<latD>[0-9]{2})(?<latM>[0-9]{2}\.[0-9]+)(?<lonRef>[+-])(?<lonD>[0-9]{3})(?<lonM>[0-9]{2}\.[0-9]+)(?<altitude>[+-][0-9]{1,3}\.[0-9]+)/,
)
// Latitude, Longitude (in Degrees, Minutes and Seconds) and Altitude:
//     ±DDMMSS.SSSS±DDDMMSS.SSSS±AAA.AAA (eg +123456.7-0985432.1+15.9)
const latlngdmsalt = new RegExp(
    /(?<latRef>[+-])(?<latD>[0-9]{2})(?<latM>[0-9]{2})(?<latS>[0-9]{2}\.[0-9]+)(?<lonRef>[+-])(?<lonD>[0-9]{3})(?<lonM>[0-9]{2})(?<lonS>[0-9]{2}\.[0-9]+)(?<altitude>[+-][0-9]{1,3}\.[0-9]+)/,
)

export function iso2dec(string) {
    switch (true) {
        case latlngdmsalt.test(string): {
            const match = string.match(latlngdmsalt)
            const pos = {
                latitude: [parseInt(match.groups.latD), parseInt(match.groups.latM), parseFloat(match.groups.latS)],
                latRef: match.groups.latRef == '+' ? 'N' : 'S',
                longitude: [parseInt(match.groups.lonD), parseInt(match.groups.lonM), parseFloat(match.groups.lonS)],
                lonRef: match.groups.lonRef == '+' ? 'E' : 'W',
            }
            const altitude = match.groups.altitude
            const [latitude, longitude] = dms2dec(pos.latitude, pos.latRef, pos.longitude, pos.lonRef)
            return { latitude: latitude, longitude: longitude, altitude: altitude }
        }
        case latlngdmalt.test(string): {
            const match = string.match(latlngdmalt)
            const pos = {
                latitude: [parseInt(match.groups.latD), parseFloat(match.groups.latM), 0],
                latRef: match.groups.latRef == '+' ? 'N' : 'S',
                longitude: [parseInt(match.groups.lonD), parseFloat(match.groups.lonM), 0],
                lonRef: match.groups.lonRef == '+' ? 'E' : 'W',
            }
            const altitude = match.groups.altitude
            const [latitude, longitude] = dms2dec(pos.latitude, pos.latRef, pos.longitude, pos.lonRef)
            return { latitude: latitude, longitude: longitude, altitude: altitude }
        }
        case latlngdalt.test(string): {
            const match = string.match(latlngdalt)
            const pos = {
                latitude: [parseFloat(match.groups.latD), 0, 0],
                latRef: match.groups.latRef == '+' ? 'N' : 'S',
                longitude: [parseFloat(match.groups.lonD), 0, 0],
                lonRef: match.groups.lonRef == '+' ? 'E' : 'W',
            }
            const altitude = match.groups.altitude
            const [latitude, longitude] = dms2dec(pos.latitude, pos.latRef, pos.longitude, pos.lonRef)
            return { latitude: latitude, longitude: longitude, altitude: altitude }
        }
        case latlngdms.test(string): {
            const match = string.match(latlngdms)
            const pos = {
                latitude: [parseInt(match.groups.latD), parseInt(match.groups.latM), parseFloat(match.groups.latS)],
                latRef: match.groups.latRef == '+' ? 'N' : 'S',
                longitude: [parseInt(match.groups.lonD), parseInt(match.groups.lonM), parseFloat(match.groups.lonS)],
                lonRef: match.groups.lonRef == '+' ? 'E' : 'W',
            }
            const [latitude, longitude] = dms2dec(pos.latitude, pos.latRef, pos.longitude, pos.lonRef)
            return { latitude: latitude, longitude: longitude }
        }
        case latlngdm.test(string): {
            const match = string.match(latlngdm)
            const pos = {
                latitude: [parseInt(match.groups.latD), parseFloat(match.groups.latM), 0],
                latRef: match.groups.latRef == '+' ? 'N' : 'S',
                longitude: [parseInt(match.groups.lonD), parseFloat(match.groups.lonM), 0],
                lonRef: match.groups.lonRef == '+' ? 'E' : 'W',
            }
            const [latitude, longitude] = dms2dec(pos.latitude, pos.latRef, pos.longitude, pos.lonRef)
            return { latitude: latitude, longitude: longitude }
        }
        case latlngd.test(string): {
            const match = string.match(latlngd)
            const pos = {
                latitude: [parseFloat(match.groups.latD), 0, 0],
                latRef: match.groups.latRef == '+' ? 'N' : 'S',
                longitude: [parseFloat(match.groups.lonD), 0, 0],
                lonRef: match.groups.lonRef == '+' ? 'E' : 'W',
            }
            const [latitude, longitude] = dms2dec(pos.latitude, pos.latRef, pos.longitude, pos.lonRef)
            return { latitude: latitude, longitude: longitude }
        }
        default:
            return false
    }
}
