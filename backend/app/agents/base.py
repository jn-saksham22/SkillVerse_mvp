from abc import ABC, abstractmethod
from sqlalchemy.orm import Session


class BaseAgent(ABC):
    """
    Base class for all SKILLVERSE intelligence agents.
    """

    name = "Base Agent"
    description = ""

    def __init__(self, db: Session):
        self.db = db

    @abstractmethod
    def run(self, **kwargs):
        """
        Execute the agent and return a JSON-serializable result.
        """
        raise NotImplementedError

    def metadata(self):
        return {
            "agent": self.name,
            "description": self.description,
        }
