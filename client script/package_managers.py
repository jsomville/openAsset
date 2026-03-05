"""
Package manager extraction modules for AssetClient
"""

import json
import subprocess
from typing import List
from dataclasses import dataclass


@dataclass
class Package:
    """Represents a package with type and version"""
    type: str
    package: str
    version: str


class DpkgPackageManager:
    """Handles dpkg package retrieval"""
    
    @staticmethod
    def get_packages() -> List[Package]:
        """Get list of installed dpkg packages"""
        packages = []
        
        try:
            result = subprocess.run(
                ['dpkg', '-l'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            lines = result.stdout.split('\n')
            
            for line in lines:
                # dpkg -l format: ii  package-name    version    architecture    description
                parts = line.split()
                if len(parts) >= 3 and parts[0] == 'ii':
                    package_name = parts[1]
                    version = parts[2]
                    
                    packages.append(Package(
                        type='dpkg',
                        package=package_name,
                        version=version
                    ))
        except FileNotFoundError:
            print("Warning: dpkg not found. This is a Debian/Ubuntu system requirement.")
        except subprocess.TimeoutExpired:
            print("Warning: dpkg list timed out")
        except Exception as e:
            print(f"Warning: Error getting dpkg packages: {e}")
        
        return packages


class PipPackageManager:
    """Handles pip/Python package retrieval"""
    
    @staticmethod
    def get_packages() -> List[Package]:
        """Get list of installed pip packages"""
        packages = []
        
        try:
            result = subprocess.run(
                ['pip', 'list', '--format=json'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                pip_packages = json.loads(result.stdout)
                
                for pkg in pip_packages:
                    packages.append(Package(
                        type='pip',
                        package=pkg['name'],
                        version=pkg['version']
                    ))
        except FileNotFoundError:
            print("Warning: pip not found. Please install pip: sudo apt install python3-pip")
        except json.JSONDecodeError:
            print("Warning: Could not parse pip output")
        except subprocess.TimeoutExpired:
            print("Warning: pip list timed out")
        except Exception as e:
            print(f"Warning: Error getting pip packages: {e}")
        
        return packages
