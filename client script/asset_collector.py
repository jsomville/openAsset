"""
Asset Collector - Collects device information from various sources
"""

import subprocess
import socket
from typing import Dict, List
from dataclasses import dataclass, asdict

from package_managers import Package, DpkgPackageManager, PipPackageManager


@dataclass
class ScanData:
    """Represents the device scan data"""
    hostname: str
    host: str
    os: str
    kernel: str
    ram: str
    cpu: str
    type: str
    status: str
    uptime: str
    packages: List[Dict]


class AssetCollector:
    """Collects device information from various sources"""
    
    def __init__(self):
        self.packages: List[Package] = []
    
    def get_hostname(self) -> str:
        """Get device hostname"""
        try:
            return socket.gethostname()
        except Exception as e:
            print(f"Warning: Could not get hostname: {e}")
            return "unknown"
    
    def parse_neofetch(self) -> Dict[str, str]:
        """Parse system information using multiple methods"""
        info = {
            'host': 'unknown',
            'os': 'unknown',
            'kernel': 'unknown',
            'cpu': 'unknown',
            'ram': 'unknown',
            'uptime': 'unknown'
        }
        
        try:
            # Get hostname
            try:
                result = subprocess.run(['hostname'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    info['host'] = result.stdout.strip()
            except:
                pass
            
            # Get OS information
            try:
                result = subprocess.run(['lsb_release', '-ds'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    info['os'] = result.stdout.strip().strip('"')
            except:
                # Fallback: try to read from /etc/os-release
                try:
                    with open('/etc/os-release', 'r') as f:
                        for line in f:
                            if line.startswith('PRETTY_NAME'):
                                info['os'] = line.split('=')[1].strip().strip('"')
                                break
                except:
                    pass
            
            # Get kernel
            try:
                result = subprocess.run(['uname', '-r'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    info['kernel'] = result.stdout.strip()
            except:
                pass
            
            # Get CPU information
            try:
                result = subprocess.run(['lscpu'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if line.startswith('Model name:'):
                            info['cpu'] = line.split(':', 1)[1].strip()
                            break
                    # If not found, try getting CPU count
                    if info['cpu'] == 'unknown':
                        result = subprocess.run(['nproc'], capture_output=True, text=True, timeout=5)
                        if result.returncode == 0:
                            info['cpu'] = f"{result.stdout.strip()} CPUs"
            except:
                pass
            
            # Get RAM information
            try:
                result = subprocess.run(['free', '-h'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    lines = result.stdout.split('\n')
                    if len(lines) >= 2:
                        # Extract from "Mem:" line
                        mem_line = lines[1]
                        parts = mem_line.split()
                        if len(parts) >= 2:
                            info['ram'] = parts[1]  # Total memory
            except:
                pass
            
            # Get uptime
            try:
                result = subprocess.run(['uptime', '-p'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    info['uptime'] = result.stdout.strip()
            except:
                pass
        
        except Exception as e:
            print(f"Warning: Error getting system information: {e}")
        
        return info
    
    def collect_all_packages(self):
        """Collect all packages from various package managers"""
        print("Collecting packages...")
        
        print("  - Getting dpkg packages...")
        dpkg_packages = DpkgPackageManager.get_packages()
        print(f"    Found {len(dpkg_packages)} dpkg packages")
        
        print("  - Getting pip packages...")
        pip_packages = PipPackageManager.get_packages()
        print(f"    Found {len(pip_packages)} pip packages")
        
        self.packages = dpkg_packages + pip_packages
        print(f"Total packages collected: {len(self.packages)}")
    
    def get_device_status(self) -> str:
        """Determine device status (online/offline)"""
        return "online"
    
    def get_scan_data(self, device_type: str = 'linux') -> ScanData:
        """Collect all device information and return scan data"""
        print("Collecting device information...")
        
        hostname = self.get_hostname()
        print(f"  - Hostname: {hostname}")
        
        print("  - Gathering system information...")
        neofetch_info = self.parse_neofetch()
        
        self.collect_all_packages()
        
        # Convert packages to dictionaries
        packages_list = [asdict(pkg) for pkg in self.packages]
        
        scan_data = ScanData(
            hostname=hostname,
            host=neofetch_info.get('host', 'unknown'),
            os=neofetch_info.get('os', 'unknown'),
            kernel=neofetch_info.get('kernel', 'unknown'),
            ram=neofetch_info.get('ram', 'unknown'),
            cpu=neofetch_info.get('cpu', 'unknown'),
            type=device_type,
            status=self.get_device_status(),
            uptime=neofetch_info.get('uptime', 'unknown'),
            packages=packages_list
        )
        
        return scan_data
