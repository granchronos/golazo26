-- =============================================
-- Seed 48 teams for FIFA World Cup 2026
-- Official FIFA draw (March 2026)
-- =============================================
INSERT INTO teams (id, name, code, flag_emoji, confederation, group_letter) VALUES
-- GROUP A
('mex','México','MEX','🇲🇽','CONCACAF','A'),
('rsa','Sudáfrica','RSA','🇿🇦','CAF','A'),
('kor','Corea del Sur','KOR','🇰🇷','AFC','A'),
('cze','República Checa','CZE','🇨🇿','UEFA','A'),
-- GROUP B
('can','Canadá','CAN','🇨🇦','CONCACAF','B'),
('bih','Bosnia y Herzegovina','BIH','🇧🇦','UEFA','B'),
('qat','Catar','QAT','🇶🇦','AFC','B'),
('sui','Suiza','SUI','🇨🇭','UEFA','B'),
-- GROUP C
('bra','Brasil','BRA','🇧🇷','CONMEBOL','C'),
('mar','Marruecos','MAR','🇲🇦','CAF','C'),
('hai','Haití','HAI','🇭🇹','CONCACAF','C'),
('sco','Escocia','SCO','🏴󠁧󠁢󠁳󠁣󠁴󠁿','UEFA','C'),
-- GROUP D
('usa','Estados Unidos','USA','🇺🇸','CONCACAF','D'),
('pry','Paraguay','PRY','🇵🇾','CONMEBOL','D'),
('aus','Australia','AUS','🇦🇺','AFC','D'),
('tur','Turquía','TUR','🇹🇷','UEFA','D'),
-- GROUP E
('ger','Alemania','GER','🇩🇪','UEFA','E'),
('cuw','Curazao','CUW','🇨🇼','CONCACAF','E'),
('civ','Costa de Marfil','CIV','🇨🇮','CAF','E'),
('ecu','Ecuador','ECU','🇪🇨','CONMEBOL','E'),
-- GROUP F
('ned','Países Bajos','NED','🇳🇱','UEFA','F'),
('jpn','Japón','JPN','🇯🇵','AFC','F'),
('swe','Suecia','SWE','🇸🇪','UEFA','F'),
('tun','Túnez','TUN','🇹🇳','CAF','F'),
-- GROUP G
('bel','Bélgica','BEL','🇧🇪','UEFA','G'),
('egy','Egipto','EGY','🇪🇬','CAF','G'),
('irn','Irán','IRN','🇮🇷','AFC','G'),
('nzl','Nueva Zelanda','NZL','🇳🇿','OFC','G'),
-- GROUP H
('esp','España','ESP','🇪🇸','UEFA','H'),
('cpv','Cabo Verde','CPV','🇨🇻','CAF','H'),
('ksa','Arabia Saudí','KSA','🇸🇦','AFC','H'),
('uru','Uruguay','URU','🇺🇾','CONMEBOL','H'),
-- GROUP I
('fra','Francia','FRA','🇫🇷','UEFA','I'),
('sen','Senegal','SEN','🇸🇳','CAF','I'),
('irq','Irak','IRQ','🇮🇶','AFC','I'),
('nor','Noruega','NOR','🇳🇴','UEFA','I'),
-- GROUP J
('arg','Argentina','ARG','🇦🇷','CONMEBOL','J'),
('alg','Argelia','ALG','🇩🇿','CAF','J'),
('aut','Austria','AUT','🇦🇹','UEFA','J'),
('jor','Jordania','JOR','🇯🇴','AFC','J'),
-- GROUP K
('por','Portugal','POR','🇵🇹','UEFA','K'),
('cod','RD del Congo','COD','🇨🇩','CAF','K'),
('uzb','Uzbekistán','UZB','🇺🇿','AFC','K'),
('col','Colombia','COL','🇨🇴','CONMEBOL','K'),
-- GROUP L
('eng','Inglaterra','ENG','🏴󠁧󠁢󠁥󠁮󠁧󠁿','UEFA','L'),
('cro','Croacia','CRO','🇭🇷','UEFA','L'),
('gha','Ghana','GHA','🇬🇭','CAF','L'),
('pan','Panamá','PAN','🇵🇦','CONCACAF','L')
ON CONFLICT (id) DO NOTHING;
