-- =============================================
-- Migration 006: Seed all 103 matches
-- Group stage (M1-M72) + Knockout (M73-M103)
-- Safe to re-run: ON CONFLICT DO NOTHING
-- =============================================

INSERT INTO matches (match_number, round, home_team_id, away_team_id, match_date, venue, city) VALUES

-- ── GROUP STAGE ─────────────────────────────────────────────────────

-- Group A
(1,  'group', 'mex', 'rsa', '2026-06-11T19:00:00Z', 'Estadio Azteca',            'Ciudad de México'),
(2,  'group', 'kor', 'cze', '2026-06-12T02:00:00Z', 'Estadio Akron',             'Guadalajara'),
(25, 'group', 'cze', 'rsa', '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium',     'Atlanta'),
(26, 'group', 'mex', 'kor', '2026-06-19T01:00:00Z', 'Estadio Akron',             'Guadalajara'),
(49, 'group', 'cze', 'mex', '2026-06-25T01:00:00Z', 'Estadio Azteca',            'Ciudad de México'),
(50, 'group', 'rsa', 'kor', '2026-06-25T01:00:00Z', 'Estadio BBVA',              'Monterrey'),

-- Group B
(3,  'group', 'can', 'bih', '2026-06-12T19:00:00Z', 'BMO Field',                 'Toronto'),
(4,  'group', 'qat', 'sui', '2026-06-13T19:00:00Z', 'Levi''s Stadium',           'San Francisco'),
(27, 'group', 'sui', 'bih', '2026-06-18T19:00:00Z', 'SoFi Stadium',              'Los Ángeles'),
(28, 'group', 'can', 'qat', '2026-06-18T22:00:00Z', 'BC Place',                  'Vancouver'),
(51, 'group', 'sui', 'can', '2026-06-24T19:00:00Z', 'BC Place',                  'Vancouver'),
(52, 'group', 'bih', 'qat', '2026-06-24T19:00:00Z', 'Lumen Field',               'Seattle'),

-- Group C
(5,  'group', 'bra', 'mar', '2026-06-13T22:00:00Z', 'MetLife Stadium',            'Nueva York'),
(6,  'group', 'hai', 'sco', '2026-06-14T01:00:00Z', 'Gillette Stadium',           'Boston'),
(29, 'group', 'sco', 'mar', '2026-06-19T22:00:00Z', 'Gillette Stadium',           'Boston'),
(30, 'group', 'bra', 'hai', '2026-06-20T01:00:00Z', 'Lincoln Financial Field',    'Filadelfia'),
(53, 'group', 'bra', 'sco', '2026-06-24T22:00:00Z', 'Hard Rock Stadium',          'Miami'),
(54, 'group', 'mar', 'hai', '2026-06-24T22:00:00Z', 'Mercedes-Benz Stadium',      'Atlanta'),

-- Group D
(7,  'group', 'usa', 'pry', '2026-06-13T01:00:00Z', 'SoFi Stadium',               'Los Ángeles'),
(8,  'group', 'aus', 'tur', '2026-06-13T04:00:00Z', 'BC Place',                   'Vancouver'),
(31, 'group', 'usa', 'aus', '2026-06-19T19:00:00Z', 'Lumen Field',                'Seattle'),
(32, 'group', 'tur', 'pry', '2026-06-20T04:00:00Z', 'Levi''s Stadium',            'San Francisco'),
(55, 'group', 'tur', 'usa', '2026-06-26T02:00:00Z', 'SoFi Stadium',               'Los Ángeles'),
(56, 'group', 'pry', 'aus', '2026-06-26T02:00:00Z', 'Levi''s Stadium',            'San Francisco'),

-- Group E
(9,  'group', 'ger', 'cuw', '2026-06-14T17:00:00Z', 'NRG Stadium',                'Houston'),
(10, 'group', 'civ', 'ecu', '2026-06-14T23:00:00Z', 'Lincoln Financial Field',    'Filadelfia'),
(33, 'group', 'ger', 'civ', '2026-06-20T20:00:00Z', 'BMO Field',                  'Toronto'),
(34, 'group', 'ecu', 'cuw', '2026-06-21T02:00:00Z', 'Arrowhead Stadium',          'Kansas City'),
(57, 'group', 'cuw', 'civ', '2026-06-25T20:00:00Z', 'Lincoln Financial Field',    'Filadelfia'),
(58, 'group', 'ecu', 'ger', '2026-06-25T20:00:00Z', 'MetLife Stadium',            'Nueva York'),

-- Group F
(11, 'group', 'ned', 'jpn', '2026-06-14T20:00:00Z', 'AT&T Stadium',               'Dallas'),
(12, 'group', 'swe', 'tun', '2026-06-15T02:00:00Z', 'Estadio BBVA',               'Monterrey'),
(35, 'group', 'ned', 'swe', '2026-06-20T17:00:00Z', 'NRG Stadium',                'Houston'),
(36, 'group', 'tun', 'jpn', '2026-06-21T04:00:00Z', 'Estadio BBVA',               'Monterrey'),
(59, 'group', 'jpn', 'swe', '2026-06-25T23:00:00Z', 'AT&T Stadium',               'Dallas'),
(60, 'group', 'tun', 'ned', '2026-06-25T23:00:00Z', 'Arrowhead Stadium',          'Kansas City'),

-- Group G
(13, 'group', 'bel', 'egy', '2026-06-15T19:00:00Z', 'Lumen Field',                'Seattle'),
(14, 'group', 'irn', 'nzl', '2026-06-16T01:00:00Z', 'SoFi Stadium',              'Los Ángeles'),
(37, 'group', 'bel', 'irn', '2026-06-21T19:00:00Z', 'SoFi Stadium',              'Los Ángeles'),
(38, 'group', 'nzl', 'egy', '2026-06-22T01:00:00Z', 'BC Place',                  'Vancouver'),
(61, 'group', 'egy', 'irn', '2026-06-27T03:00:00Z', 'Lumen Field',               'Seattle'),
(62, 'group', 'nzl', 'bel', '2026-06-27T03:00:00Z', 'BC Place',                  'Vancouver'),

-- Group H
(15, 'group', 'esp', 'cpv', '2026-06-15T16:00:00Z', 'Mercedes-Benz Stadium',     'Atlanta'),
(16, 'group', 'ksa', 'uru', '2026-06-15T22:00:00Z', 'Hard Rock Stadium',         'Miami'),
(39, 'group', 'esp', 'ksa', '2026-06-21T16:00:00Z', 'Mercedes-Benz Stadium',     'Atlanta'),
(40, 'group', 'uru', 'cpv', '2026-06-21T22:00:00Z', 'Hard Rock Stadium',         'Miami'),
(63, 'group', 'cpv', 'ksa', '2026-06-27T00:00:00Z', 'NRG Stadium',               'Houston'),
(64, 'group', 'uru', 'esp', '2026-06-27T00:00:00Z', 'Estadio Akron',             'Guadalajara'),

-- Group I
(17, 'group', 'fra', 'sen', '2026-06-16T19:00:00Z', 'MetLife Stadium',            'Nueva York'),
(18, 'group', 'irq', 'nor', '2026-06-16T22:00:00Z', 'Gillette Stadium',           'Boston'),
(41, 'group', 'fra', 'irq', '2026-06-22T21:00:00Z', 'Lincoln Financial Field',    'Filadelfia'),
(42, 'group', 'nor', 'sen', '2026-06-23T00:00:00Z', 'MetLife Stadium',            'Nueva York'),
(65, 'group', 'nor', 'fra', '2026-06-26T19:00:00Z', 'Gillette Stadium',           'Boston'),
(66, 'group', 'sen', 'irq', '2026-06-26T19:00:00Z', 'BMO Field',                  'Toronto'),

-- Group J
(19, 'group', 'arg', 'alg', '2026-06-17T01:00:00Z', 'Arrowhead Stadium',          'Kansas City'),
(20, 'group', 'aut', 'jor', '2026-06-17T04:00:00Z', 'Levi''s Stadium',            'San Francisco'),
(43, 'group', 'arg', 'aut', '2026-06-22T17:00:00Z', 'AT&T Stadium',               'Dallas'),
(44, 'group', 'jor', 'alg', '2026-06-23T03:00:00Z', 'Levi''s Stadium',            'San Francisco'),
(67, 'group', 'alg', 'aut', '2026-06-28T02:00:00Z', 'Arrowhead Stadium',          'Kansas City'),
(68, 'group', 'jor', 'arg', '2026-06-28T02:00:00Z', 'AT&T Stadium',               'Dallas'),

-- Group K
(21, 'group', 'por', 'cod', '2026-06-17T17:00:00Z', 'NRG Stadium',                'Houston'),
(22, 'group', 'uzb', 'col', '2026-06-18T02:00:00Z', 'Estadio Azteca',             'Ciudad de México'),
(45, 'group', 'por', 'uzb', '2026-06-23T17:00:00Z', 'NRG Stadium',                'Houston'),
(46, 'group', 'col', 'cod', '2026-06-24T02:00:00Z', 'Estadio Akron',              'Guadalajara'),
(69, 'group', 'col', 'por', '2026-06-27T23:30:00Z', 'Hard Rock Stadium',          'Miami'),
(70, 'group', 'cod', 'uzb', '2026-06-27T23:30:00Z', 'Mercedes-Benz Stadium',      'Atlanta'),

-- Group L
(23, 'group', 'eng', 'cro', '2026-06-17T20:00:00Z', 'AT&T Stadium',               'Dallas'),
(24, 'group', 'gha', 'pan', '2026-06-17T23:00:00Z', 'BMO Field',                  'Toronto'),
(47, 'group', 'eng', 'gha', '2026-06-23T20:00:00Z', 'Gillette Stadium',           'Boston'),
(48, 'group', 'pan', 'cro', '2026-06-23T23:00:00Z', 'BMO Field',                  'Toronto'),
(71, 'group', 'pan', 'eng', '2026-06-27T21:00:00Z', 'MetLife Stadium',            'Nueva York'),
(72, 'group', 'cro', 'gha', '2026-06-27T21:00:00Z', 'Lincoln Financial Field',    'Filadelfia'),

-- ── KNOCKOUT STAGE ──────────────────────────────────────────────────

-- Round of 32 (M73-M88)
(73,  'round_of_32', NULL, NULL, '2026-06-29T20:00:00Z', 'TBD', 'TBD'),
(74,  'round_of_32', NULL, NULL, '2026-06-29T23:00:00Z', 'TBD', 'TBD'),
(75,  'round_of_32', NULL, NULL, '2026-06-30T20:00:00Z', 'TBD', 'TBD'),
(76,  'round_of_32', NULL, NULL, '2026-06-30T23:00:00Z', 'TBD', 'TBD'),
(77,  'round_of_32', NULL, NULL, '2026-07-01T20:00:00Z', 'TBD', 'TBD'),
(78,  'round_of_32', NULL, NULL, '2026-07-01T23:00:00Z', 'TBD', 'TBD'),
(79,  'round_of_32', NULL, NULL, '2026-07-02T20:00:00Z', 'TBD', 'TBD'),
(80,  'round_of_32', NULL, NULL, '2026-07-02T23:00:00Z', 'TBD', 'TBD'),
(81,  'round_of_32', NULL, NULL, '2026-07-03T20:00:00Z', 'TBD', 'TBD'),
(82,  'round_of_32', NULL, NULL, '2026-07-03T23:00:00Z', 'TBD', 'TBD'),
(83,  'round_of_32', NULL, NULL, '2026-07-04T20:00:00Z', 'TBD', 'TBD'),
(84,  'round_of_32', NULL, NULL, '2026-07-04T23:00:00Z', 'TBD', 'TBD'),
(85,  'round_of_32', NULL, NULL, '2026-07-05T20:00:00Z', 'TBD', 'TBD'),
(86,  'round_of_32', NULL, NULL, '2026-07-05T23:00:00Z', 'TBD', 'TBD'),
(87,  'round_of_32', NULL, NULL, '2026-07-06T20:00:00Z', 'TBD', 'TBD'),
(88,  'round_of_32', NULL, NULL, '2026-07-06T23:00:00Z', 'TBD', 'TBD'),

-- Round of 16 (M89-M96)
(89,  'round_of_16', NULL, NULL, '2026-07-08T20:00:00Z', 'TBD', 'TBD'),
(90,  'round_of_16', NULL, NULL, '2026-07-08T23:00:00Z', 'TBD', 'TBD'),
(91,  'round_of_16', NULL, NULL, '2026-07-09T20:00:00Z', 'TBD', 'TBD'),
(92,  'round_of_16', NULL, NULL, '2026-07-09T23:00:00Z', 'TBD', 'TBD'),
(93,  'round_of_16', NULL, NULL, '2026-07-10T20:00:00Z', 'TBD', 'TBD'),
(94,  'round_of_16', NULL, NULL, '2026-07-10T23:00:00Z', 'TBD', 'TBD'),
(95,  'round_of_16', NULL, NULL, '2026-07-11T20:00:00Z', 'TBD', 'TBD'),
(96,  'round_of_16', NULL, NULL, '2026-07-11T23:00:00Z', 'TBD', 'TBD'),

-- Quarter Finals (M97-M100)
(97,  'quarter_finals', NULL, NULL, '2026-07-14T20:00:00Z', 'TBD', 'TBD'),
(98,  'quarter_finals', NULL, NULL, '2026-07-14T23:00:00Z', 'TBD', 'TBD'),
(99,  'quarter_finals', NULL, NULL, '2026-07-15T20:00:00Z', 'TBD', 'TBD'),
(100, 'quarter_finals', NULL, NULL, '2026-07-15T23:00:00Z', 'TBD', 'TBD'),

-- Semi Finals (M101-M102)
(101, 'semi_finals', NULL, NULL, '2026-07-14T20:00:00Z', 'MetLife Stadium', 'Nueva York'),
(102, 'semi_finals', NULL, NULL, '2026-07-15T20:00:00Z', 'AT&T Stadium',    'Dallas'),

-- Final (M103)
(103, 'final', NULL, NULL, '2026-07-19T20:00:00Z', 'MetLife Stadium', 'Nueva York')

ON CONFLICT (match_number) DO NOTHING;
