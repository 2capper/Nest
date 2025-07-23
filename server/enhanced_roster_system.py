#!/usr/bin/env python3

import json
import os
import re
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional
import subprocess
from thefuzz import fuzz
import requests

class EnhancedOBARosterSystem:
    """Enhanced OBA Roster System with local team database and live roster fetching"""
    
    def __init__(self):
        self.base_url = "https://www.playoba.ca/stats"
        self.team_db_file = "server/oba_teams_database.json"
        self.cache_db = "server/roster_cache.db"
        self.setup_cache()
    
    def setup_cache(self):
        """Initialize roster cache database"""
        try:
            conn = sqlite3.connect(self.cache_db)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS roster_cache (
                    team_url TEXT PRIMARY KEY,
                    roster_data TEXT,
                    cached_at TEXT
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS team_database (
                    team_id TEXT PRIMARY KEY,
                    team_name TEXT,
                    division TEXT,
                    classification TEXT,
                    affiliate_number TEXT,
                    affiliate_name TEXT,
                    team_url TEXT,
                    player_count INTEGER,
                    last_scanned TEXT
                )
            ''')
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Cache setup error: {e}")

    def build_comprehensive_team_database(self) -> Dict:
        """Build comprehensive database of active OBA teams across all affiliates"""
        print("🔍 Building comprehensive OBA team database...")
        
        # Known active team ID ranges and affiliates based on verified data
        scan_targets = [
            # LDBA (London District) - verified teams
            {"affiliate": "2106", "name": "LDBA", "ranges": [(500400, 500450), (503300, 503350)]},
            # ICBA (Intercounty) - verified teams  
            {"affiliate": "2105", "name": "ICBA", "ranges": [(499900, 499950)]},
            # SPBA (Sun Parlour) - verified teams
            {"affiliate": "2111", "name": "SPBA", "ranges": [(500300, 500400)]},
            # ABA (Hamilton/Ancaster)
            {"affiliate": "0500", "name": "ABA", "ranges": [(500750, 500850)]},
            # WOBA (Windsor)
            {"affiliate": "2100", "name": "WOBA", "ranges": [(500500, 500600)]},
        ]
        
        all_teams = {}
        total_discovered = 0
        
        for target in scan_targets:
            print(f"\n📡 Scanning {target['name']} (#{target['affiliate']})...")
            affiliate_teams = []
            
            for start_id, end_id in target['ranges']:
                print(f"  Range: {start_id}-{end_id}")
                
                for team_id in range(start_id, end_id + 1, 5):  # Sample every 5th ID for speed
                    team_url = f"{self.base_url}#/{target['affiliate']}/team/{team_id}/roster"
                    
                    try:
                        roster_data = self.fetch_live_roster(team_url)
                        
                        if roster_data and roster_data.get('team_name') != "Unknown Team":
                            team_name = roster_data['team_name']
                            
                            # Parse division
                            division = "Unknown"
                            for div in ["11U", "13U", "15U", "18U"]:
                                if div in team_name:
                                    division = div
                                    break
                            
                            # Parse classification
                            classification = "Unknown"
                            for cls in ["AAA", "AA", "A", "HS", "DS", "Rep", "Select"]:
                                if cls in team_name:
                                    classification = cls
                                    break
                            
                            team_info = {
                                'id': str(team_id),
                                'name': team_name,
                                'division': division,
                                'classification': classification,
                                'affiliate_number': target['affiliate'],
                                'affiliate_name': target['name'],
                                'url': team_url,
                                'player_count': len(roster_data.get('players', [])),
                                'last_scanned': datetime.now().isoformat()
                            }
                            
                            affiliate_teams.append(team_info)
                            
                            # Store in database
                            self.store_team_in_db(team_info)
                            
                            print(f"  ✅ {team_name} ({len(roster_data.get('players', []))} players)")
                            
                    except Exception as e:
                        continue  # Skip failed teams
                
            all_teams[target['name']] = affiliate_teams
            total_discovered += len(affiliate_teams)
            print(f"✅ {target['name']}: {len(affiliate_teams)} teams discovered")
        
        # Save to JSON file
        database = {
            'affiliates': all_teams,
            'total_teams': total_discovered,
            'scan_date': datetime.now().isoformat(),
            'version': '2.0'
        }
        
        with open(self.team_db_file, 'w') as f:
            json.dump(database, f, indent=2)
        
        print(f"\n🎯 Database built: {total_discovered} teams across {len(all_teams)} affiliates")
        return database

    def store_team_in_db(self, team_info: Dict):
        """Store team information in SQLite database"""
        try:
            conn = sqlite3.connect(self.cache_db)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO team_database 
                (team_id, team_name, division, classification, affiliate_number, 
                 affiliate_name, team_url, player_count, last_scanned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                team_info['id'],
                team_info['name'],
                team_info['division'],
                team_info['classification'],
                team_info['affiliate_number'],
                team_info['affiliate_name'],
                team_info['url'],
                team_info['player_count'],
                team_info['last_scanned']
            ))
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Database storage error: {e}")

    def search_teams_by_name(self, team_name: str, division: str = "") -> List[Dict]:
        """Search local database for teams matching the name and division"""
        matches = []
        
        try:
            conn = sqlite3.connect(self.cache_db)
            cursor = conn.cursor()
            
            # Build query
            query = '''
                SELECT team_id, team_name, division, classification, 
                       affiliate_number, affiliate_name, team_url, player_count
                FROM team_database 
                WHERE 1=1
            '''
            params = []
            
            if division:
                query += " AND division = ?"
                params.append(division)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            for row in rows:
                team_id, name, div, cls, aff_num, aff_name, url, player_count = row
                
                # Calculate fuzzy match score
                score = fuzz.token_sort_ratio(team_name.lower(), name.lower()) / 100.0
                
                if score > 0.4:  # Minimum similarity threshold
                    matches.append({
                        'id': team_id,
                        'name': name,
                        'division': div,
                        'classification': cls,
                        'affiliate_number': aff_num,
                        'affiliate_name': aff_name,
                        'url': url,
                        'player_count': player_count,
                        'match_score': score
                    })
            
            conn.close()
            
            # Sort by match score
            matches.sort(key=lambda x: x['match_score'], reverse=True)
            
        except Exception as e:
            print(f"Search error: {e}")
        
        return matches[:10]  # Return top 10 matches

    def fetch_live_roster(self, team_url: str) -> Optional[Dict]:
        """Fetch live roster data from OBA website using proven method"""
        try:
            # Use curl with proper headers (proven to work)
            cmd = [
                'curl', '-s', '-L', '--max-time', '15',
                '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                team_url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
            
            if result.returncode == 0 and result.stdout:
                html_content = result.stdout
                
                # Parse team name
                team_name = "Unknown Team"
                h1_patterns = [
                    r'<h1[^>]*>([^<]+)</h1>',
                    r'># ([^,\n]+)',
                    r'<title>([^<]+)</title>'
                ]
                
                for pattern in h1_patterns:
                    h1_match = re.search(pattern, html_content, re.IGNORECASE)
                    if h1_match:
                        team_name = h1_match.group(1).strip()
                        if "Stats - Ontario Baseball" not in team_name:
                            break
                
                # Extract player names using proven pattern
                markdown_pattern = r'\[([A-Z][a-z]+ [A-Z][a-z]+[^]]*)\]\(https://www\.playoba\.ca/stats#/player/\d+/bio\)'
                player_matches = re.findall(markdown_pattern, html_content)
                
                # Clean and validate players
                players = []
                seen_players = set()
                
                for i, player_name in enumerate(player_matches, 1):
                    clean_name = player_name.strip()
                    if (clean_name and 
                        clean_name not in seen_players and 
                        len(clean_name.split()) >= 2 and
                        clean_name[0].isupper() and
                        not any(word.lower() in clean_name.lower() for word in ['skip', 'content', 'tournament'])):
                        
                        seen_players.add(clean_name)
                        players.append({
                            "number": str(i),
                            "name": clean_name
                        })
                
                if players:
                    return {
                        'team_url': team_url,
                        'team_name': team_name,
                        'players': players,
                        'scraped_at': datetime.now().isoformat(),
                        'authentic_data': True,
                        'method': 'live_web_scraping'
                    }
            
            return None
            
        except Exception as e:
            print(f"Live roster fetch error: {e}")
            return None

    def import_roster_for_team(self, tournament_team_name: str, division: str) -> Dict:
        """Complete roster import process: search locally, fetch live data"""
        
        print(f"🎯 Starting roster import for: {tournament_team_name} ({division})")
        
        # Step 1: Search local database
        matches = self.search_teams_by_name(tournament_team_name, division)
        
        if not matches:
            return {
                'success': False,
                'error': 'No matching OBA teams found in database',
                'suggestion': 'Try running team scanner to update database'
            }
        
        # Step 2: Get best match
        best_match = matches[0]
        print(f"📍 Best match: {best_match['name']} (score: {best_match['match_score']:.2f})")
        
        # Step 3: Fetch live roster data
        live_roster = self.fetch_live_roster(best_match['url'])
        
        if not live_roster:
            return {
                'success': False,
                'error': 'Could not fetch live roster data',
                'team_match': best_match
            }
        
        print(f"✅ Live roster fetched: {len(live_roster['players'])} players")
        
        return {
            'success': True,
            'tournament_team': tournament_team_name,
            'oba_team': best_match,
            'roster_data': live_roster,
            'players_imported': len(live_roster['players']),
            'all_matches': matches  # In case user wants to see alternatives
        }


# Command line interface
if __name__ == "__main__":
    import sys
    
    roster_system = EnhancedOBARosterSystem()
    
    if len(sys.argv) < 2:
        print("Usage: python enhanced_roster_system.py <command> [args]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "build_database":
        result = roster_system.build_comprehensive_team_database()
        print(json.dumps(result, indent=2))
        
    elif command == "search_team":
        if len(sys.argv) < 3:
            print("Usage: python enhanced_roster_system.py search_team <team_name> [division]")
            sys.exit(1)
            
        team_name = sys.argv[2]
        division = sys.argv[3] if len(sys.argv) > 3 else ""
        
        matches = roster_system.search_teams_by_name(team_name, division)
        print(json.dumps({"matches": matches}, indent=2))
        
    elif command == "import_roster":
        if len(sys.argv) < 4:
            print("Usage: python enhanced_roster_system.py import_roster <team_name> <division>")
            sys.exit(1)
            
        team_name = sys.argv[2]
        division = sys.argv[3]
        
        result = roster_system.import_roster_for_team(team_name, division)
        print(json.dumps(result, indent=2))
        
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)