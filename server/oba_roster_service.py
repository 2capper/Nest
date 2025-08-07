#!/usr/bin/env python3
"""
OBA Roster Service - Integration service for the tournament management system
Provides team discovery and roster extraction capabilities
"""

import json
import sys
import os
from direct_oba_scraper import DirectOBAScraper

class OBARosterService:
    def __init__(self):
        self.scraper = DirectOBAScraper()
    
    def search_teams(self, team_name: str) -> dict:
        """Search for teams by name"""
        try:
            result = self.scraper.find_teams_by_name(team_name, min_confidence=50)
            
            # Format for frontend consumption
            if result['success']:
                teams = []
                for team in result['teams']:
                    teams.append({
                        'id': team['team_id'],
                        'name': team['team_name'],
                        'affiliate': team['affiliate'],
                        'ageGroup': team['age_group'],
                        'confidence': team['confidence']
                    })
                
                return {
                    'success': True,
                    'teams': teams,
                    'searchTerm': result['search_term']
                }
            else:
                return {
                    'success': False,
                    'error': result['error'],
                    'availableTeams': result.get('available_teams', []),
                    'searchTerm': result['search_term']
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Service error: {str(e)}'
            }
    
    def discover_teams_in_range(self, start_id: int, end_id: int) -> dict:
        """Discover teams in a specific ID range"""
        try:
            results = self.scraper.scan_team_range(start_id, end_id, max_requests=30)
            
            teams = []
            for result in results:
                teams.append({
                    'id': result['team_id'],
                    'name': result['team_name'],
                    'status': result['status'],
                    'confidence': result.get('confidence', 0)
                })
            
            return {
                'success': True,
                'teams': teams,
                'scanned_range': f"{start_id}-{end_id}"
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Discovery error: {str(e)}'
            }
    
    def get_cached_teams(self) -> dict:
        """Get all cached teams"""
        try:
            teams = self.scraper.get_cached_teams()
            
            formatted_teams = []
            for team in teams:
                formatted_teams.append({
                    'id': team['team_id'],
                    'name': team['team_name'],
                    'affiliate': team['affiliate'],
                    'ageGroup': team['age_group']
                })
            
            return {
                'success': True,
                'teams': formatted_teams
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Cache error: {str(e)}'
            }
    
    def extract_roster_for_team(self, team_id: str) -> dict:
        """Extract roster data for a specific team"""
        try:
            # Try different URL patterns for roster extraction
            patterns = [
                f"https://www.playoba.ca/stats#/2111/team/{team_id}/roster",
                f"https://www.playoba.ca/stats#/2102/team/{team_id}/roster", 
                f"https://www.playoba.ca/stats#/2106/team/{team_id}/roster"
            ]
            
            for url in patterns:
                # Use requests to check if roster data exists
                response = self.scraper.session.get(url, timeout=10)
                if response.status_code == 200 and 'roster' in response.text.lower():
                    # For now, return basic team info since full roster extraction 
                    # requires JavaScript rendering
                    teams = self.scraper.get_cached_teams()
                    team_info = next((t for t in teams if t['team_id'] == team_id), None)
                    
                    if team_info:
                        return {
                            'success': True,
                            'team_id': team_id,
                            'team_name': team_info['team_name'],
                            'roster_url': url,
                            'message': 'Roster URL found - full extraction requires manual verification'
                        }
            
            return {
                'success': False,
                'error': 'No accessible roster found for this team'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Roster extraction error: {str(e)}'
            }

def handle_request():
    """Handle command line requests from Node.js server"""
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No command provided'}))
        return
    
    service = OBARosterService()
    command = sys.argv[1]
    
    try:
        if command == 'search' and len(sys.argv) >= 3:
            team_name = ' '.join(sys.argv[2:])
            result = service.search_teams(team_name)
            
        elif command == 'discover' and len(sys.argv) >= 4:
            start_id = int(sys.argv[2])
            end_id = int(sys.argv[3])
            result = service.discover_teams_in_range(start_id, end_id)
            
        elif command == 'list':
            result = service.get_cached_teams()
            
        elif command == 'roster' and len(sys.argv) >= 3:
            team_id = sys.argv[2]
            result = service.extract_roster_for_team(team_id)
            
        else:
            result = {'success': False, 'error': f'Unknown command: {command}'}
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == "__main__":
    handle_request()